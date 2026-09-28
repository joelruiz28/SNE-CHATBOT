// Validar nombre completo
function validarNombre(nombre){

    if(!nombre) return false;

    return nombre.trim().length >= 5;

}


// Validar CURP
function validarCURP(curp){

    if(!curp) return false;


    const formatoCURP =
    /^[A-Z]{4}[0-9]{6}[A-Z]{6}[A-Z0-9]{2}$/;


    return formatoCURP.test(curp);

}


// Validar teléfono

function validarTelefono(telefono){

    return /^[0-9]{10}$/.test(telefono);

}


// Validar correo

function validarCorreo(correo){

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

}

function convertirFecha(fecha){

    const meses = {
        enero: "01",
        febrero: "02",
        marzo: "03",
        abril: "04",
        mayo: "05",
        junio: "06",
        julio: "07",
        agosto: "08",
        septiembre: "09",
        octubre: "10",
        noviembre: "11",
        diciembre: "12"
    };


    fecha = fecha.toLowerCase().trim();


    // Formato: 08 de noviembre de 2003

    const partes = fecha.split(" ");


    if(partes.length >= 5){

        const dia = partes[0].padStart(2,"0");
        const mes = meses[partes[2]];
        const año = partes[4];


        if(mes){

            return `${año}-${mes}-${dia}`;

        }

    }


    // Formato 08/11/2003

    const formatoSlash =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;


    if(formatoSlash.test(fecha)){


        const resultado =
        fecha.match(formatoSlash);


        return `${resultado[3]}-${resultado[2].padStart(2,"0")}-${resultado[1].padStart(2,"0")}`;

    }



    return null;

}


module.exports={
    validarNombre,
    validarCURP,
    validarTelefono,
    validarCorreo,
    convertirFecha
};