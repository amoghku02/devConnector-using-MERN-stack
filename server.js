const express = require('express');
const connectDB = require('./config/db');
const app = express();

const PORT = process.env.PORT || 5000 ;

app.get('/', (req,res) => res.send('API running!'));

//Init
app.use(express.json({extended: false}));

//defining routes
app.use('/api/auth', require('./routes/api/auth.js'));
app.use('/api/posts', require('./routes/api/posts.js'));
app.use('/api/profile', require('./routes/api/profile.js'));
app.use('/api/users', require('./routes/api/users.js'));

app.listen(PORT, () => console.log(`server running on port ${PORT}`));