const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require('cors');

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const datasetRoute= require("./routes/datasetRouter");
const userRouter = require("./routes/userRoutes");

const app = express();
// 1) GLOBAL Middleware
// Set security HTTP headers
app.use(helmet());


app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from this origin
}));

// Development Logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again later!",
});

app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({limit:'10kb'}));

// Data sanitizaton against NOSQL query injection
app.use(mongoSanitize());

//Data sanitizaton against XSS
app.use(xss());



// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});



// 3) Routes
app.use("/api/v1/dataset",datasetRoute);

app.use("/api/v1/users", userRouter);


app.all("*", (req, res, next) => {

  next(new AppError(`Can't find ${req.originalUrl} on the Server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;