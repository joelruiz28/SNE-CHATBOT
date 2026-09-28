function generarMenu(opciones){

    return Object.entries(opciones)
    .map(([numero,texto])=>`${numero}️⃣ ${texto}`)
    .join("\n");

}


module.exports={
    generarMenu
};