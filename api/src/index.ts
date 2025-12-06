import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { connectDB } from './config/db';

// Import Routes
import productRoutes from './routes/productRoutes';
import aiRoutes from './routes/aiRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

connectDB();

// Mount Routes
app.use('/api/products', productRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('Eyoris Fashion API is running...');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});