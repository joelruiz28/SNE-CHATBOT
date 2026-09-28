function ChatWindow() {
  return (
    <div className="flex-1 flex flex-col">

      {/* Mensajes */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* Mensaje del bot */}
        <div className="flex gap-3 mb-6">

          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
            🤖
          </div>

          <div className="max-w-xl">

            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">

              <p className="text-gray-800">
                👋 Hola, soy el asistente del SNE.
              </p>

              <p className="text-gray-800 mt-2">
                ¿En qué puedo ayudarte?
              </p>

              <div className="mt-4 space-y-2 text-sm text-gray-700">

                <p>1️⃣ Buscar vacantes</p>
                <p>2️⃣ Registrar mis datos</p>
                <p>3️⃣ Actualizar mis datos</p>
                <p>4️⃣ Consultar mi folio</p>
                <p>5️⃣ Hablar con un asesor</p>

              </div>

            </div>

            <span className="text-xs text-gray-400 ml-2 mt-1 block">
              Asistente SNE
            </span>

          </div>

        </div>

      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">

        <div className="flex gap-3 max-w-4xl mx-auto">

          <input
            type="text"
            placeholder="Escribe tu mensaje..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-medium">
            ➤
          </button>

        </div>

      </div>

    </div>
  );
}

export default ChatWindow;