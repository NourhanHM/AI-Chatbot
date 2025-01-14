from dotenv import load_dotenv
import os
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Load the .env file
load_dotenv()

# Get the API key from the environment
genai_api_key = os.getenv("GEMINI_API_KEY")
if not genai_api_key:
    raise ValueError("API key not found. Please set it in the .env file.")

genai.configure(api_key=genai_api_key)

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app)

@app.route("/")
def home():
    return send_from_directory("public", "index.html")

@app.route("/webhook", methods=["POST"])
def webhook():
    # Check if message is present in JSON
    message = request.form.get("message", "")
    file = request.files.get("file")

    if not message.strip() and not file:
        return jsonify({"error": "Please provide a valid message or upload a file."}), 400

    try:
        response_text = ""

        # Handle file upload
        if file:
            file_path = os.path.join("uploads", file.filename)
            file.save(file_path)
            file_url = f"/uploads/{file.filename}"
            response_text += f"File uploaded: {file.filename} (URL: {file_url}) "

        # Handle message processing
        if message.strip():
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(message)
            response_text += response.text.strip()

        return jsonify({"response": response_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8089)
