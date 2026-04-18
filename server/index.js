const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;

const usuariosRouter = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRouter);

const equiposRouter = require('./routes/equipos');
app.use('/api/equipos', equiposRouter);

const djsRouter = require('./routes/djs');
app.use('/api/djs', djsRouter);

const reservasRouter = require('./routes/reservas');
app.use('/api/reservas', reservasRouter);

const presupuestosRouter = require('./routes/presupuestos');
app.use('/api/presupuestos', presupuestosRouter);

const detallePresupuestoRouter = require('./routes/detalle_presupuesto');
app.use('/api/detalle_presupuesto', detallePresupuestoRouter);

const facturasRouter = require('./routes/facturas');
app.use('/api/facturas', facturasRouter);

const pagosRouter = require('./routes/pagos');
app.use('/api/pagos', pagosRouter);

const contactosRouter = require('./routes/contactos');
app.use('/api/contactos', contactosRouter);

const incluyeRouter = require('./routes/incluye');
app.use('/api/incluye', incluyeRouter);

const contrataRouter = require('./routes/contrata');
app.use('/api/contrata', contrataRouter);

const datosEmpresasRouter = require('./routes/datosEmpresas');
app.use('/api/datosEmpresas', datosEmpresasRouter);

const authsRouter = require('./routes/auths');
app.use('/api/auth', authsRouter);

const disponibilidadRouter = require('./routes/disponibilidad');
app.use('/api/disponibilidad', disponibilidadRouter);

const eventosRouter = require('./routes/eventos');
app.use('/api/eventos', eventosRouter);

app.listen(PORT, ()=>{
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});