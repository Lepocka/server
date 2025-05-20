// server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './firebaseAdmin.js'; // Імпортуємо Firestore, якщо вам потрібна робота з базою

const app = express();
const PORT = process.env.PORT || 3000;

// Для ES-модулів визначаємо __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware для CORS та обробки JSON-запитів
app.use(cors());
app.use(express.json());


app.get('/api/games/:gameId/averageRating', async (req, res) => {
  const { gameId } = req.params;
  
  // Перетворюємо gameId із рядка на число
  const numericGameId = Number(gameId);
  if (isNaN(numericGameId)) {
    return res.status(400).json({ error: 'gameId має бути числом.' });
  }
  try {
    // Робимо запит до колекції "ratings", де поле gameId співпадає із запитаним ідентифікатором
    const ratingsSnapshot = await db.collection('gameRatings').where('gameId', '==', numericGameId).get();

    // Якщо оцінок не знайдено, повертаємо середній рейтинг 0
    if (ratingsSnapshot.empty) {
      return res.json({ gameId: numericGameId, averageRating: 0 });
    }

    let totalRating = 0;
    // Проходимось по кожному документу та сумуємо значення rating
    ratingsSnapshot.forEach(doc => {
      const data = doc.data();
      totalRating += data.rating;
    });

    // Обчислюємо середній рейтинг; toFixed(1) округлює до одного десяткового знаку
    const averageRating = (totalRating / ratingsSnapshot.size).toFixed(1);

    res.json({ gameId: numericGameId, averageRating });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const buildPath = path.join(__dirname, '..', 'build');
// Хостинг статичних файлів – всі файли з каталогу "public" віддаються клієнту
app.use(express.static(path.join(buildPath)));

// Якщо ви використовуєте SPA, для усіх запитів, що не співпадають зі статичними файлами,
// повертаємо index.html
app.get(/.*/, (req, res) => {
  res.sendFile('index.html', { root: path.join(buildPath) });
});

app.listen(PORT, () => {
  console.log(`Сервер працює на порту ${PORT}`);
});
