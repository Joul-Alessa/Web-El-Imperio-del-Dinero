const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/personas', require('./routes/personas'));
app.use('/api/instituciones', require('./routes/instituciones'));
app.use('/api/divisas', require('./routes/divisas'));
app.use('/api/instrumentos', require('./routes/instrumentos'));
app.use('/api/cuentas', require('./routes/cuentas'));
app.use('/api/movimientos', require('./routes/movimientos'));
app.use('/api/historial', require('./routes/historial'));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
