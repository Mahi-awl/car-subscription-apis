import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './app/config/db.js';
import { setupCronJobs } from './app/utils/cronJobs.js';
import routes from './app/routes/index.js';
dotenv.config();





setupCronJobs();

const app = express();


app.use(express.json()); 
app.use(cors());

connectDB();
routes(app); 


app.get('/', (req, res) => {
  res.send("Hello! Welcome to the API server. Everything is working fine.");
});


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} `);
});