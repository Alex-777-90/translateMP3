ligar o backend 

cd backend

ativar o ambiente 
.\.venv\Scripts\Activate.ps1

e rodar 
uvicorn main:app --host 0.0.0.0 --port 8000 --reload


mobile 
cd mobile

npx expo start

Vai aparecer um QR Code.

No Android, instale o Expo Go e escaneie esse QR Code.
