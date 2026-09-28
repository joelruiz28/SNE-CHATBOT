const db = require("../config/database");

const {
    obtenerSesion,
    crearSesion,
    actualizarPaso
} = require("../services/sesion.service");


const {
    procesarMensaje
} = require("../services/chatbot.service");

const {
actualizarDato
}=require("../services/buscador.service");


exports.recibirMensaje = async(req,res)=>{

try{


const {telefono,mensaje}=req.body;



let sesion = await obtenerSesion(telefono);



if(!sesion){

    sesion = await crearSesion(telefono);

}



const resultado =
await procesarMensaje(
    sesion,
    mensaje,
    telefono
);



await actualizarPaso(
    telefono,
    resultado.siguientePaso
);



await db.query(
`
INSERT INTO conversaciones
(telefono,mensaje,respuesta)
VALUES($1,$2,$3)
`,
[
telefono,
mensaje,
resultado.respuesta
]
);



res.json({

telefono,

respuesta:
resultado.respuesta

});



}catch(error){

console.log(error);


res.status(500).json({

error:"Error chatbot"

});


}


};