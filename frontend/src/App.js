import React, { useEffect, useRef, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const emotionColors = {
  happy: "text-yellow-500",
  sad: "text-blue-500",
  angry: "text-red-500",
  surprise: "text-pink-500",
  neutral: "text-gray-500",
  disgust: "text-green-600",
  fear: "text-purple-600",
  contempt: "text-orange-500",
  "no face": "text-gray-400",
  Erreur: "text-black"
};

const emotionEmojis = {
  happy: "😄",
  sad: "😢",
  angry: "😡",
  surprise: "😲",
  neutral: "😐",
  disgust: "🤢",
  fear: "😱",
  contempt: "😒",
  "no face": "❓",
  Erreur: "⚠️"
};

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({});
  const [videoStream, setVideoStream] = useState(null);

  useEffect(() => {
    if (useWebcam) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setVideoStream(stream);
      });
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
        setVideoStream(null);
      }
    }
  }, [useWebcam]);

  useEffect(() => {
    if (!useWebcam || isPaused) return;
    const interval = setInterval(() => {
      captureFromWebcam();
    }, 2000);
    return () => clearInterval(interval);
  }, [useWebcam, isPaused]);

  const captureFromWebcam = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) sendImageToAPI(blob);
    }, "image/jpeg");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setUseWebcam(false);
    setEmotion(null);
  };

  const handleSubmit = () => {
    if (!selectedImage) return;
    sendImageToAPI(selectedImage);
  };

  const sendImageToAPI = async (imageBlob) => {
    const formData = new FormData();
    formData.append("image", imageBlob, "image.jpg");
    setLoading(true);
    try {
      const response = await fetch("https://emotion-app-backend.onrender.com", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      const predicted = data.prediction[0];
      setEmotion(predicted);
      setStats((prev) => ({
        ...prev,
        [predicted]: (prev[predicted] || 0) + 1
      }));
    } catch (error) {
      console.error("Erreur prédiction :", error);
      setEmotion("Erreur");
    }
    setLoading(false);
  };

  const chartData = {
    labels: Object.keys(stats),
    datasets: [
      {
        data: Object.values(stats),
        backgroundColor: [
          "#facc15", "#3b82f6", "#ef4444", "#ec4899", "#6b7280",
          "#16a34a", "#8b5cf6", "#f97316", "#9ca3af", "#000"
        ]
      }
    ]
  };

  const emotionClass = emotionColors[emotion] || "text-gray-700";
  const emoji = emotionEmojis[emotion] || "❓";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Détection d'Émotion 🤖</h1>

      <div className="mb-4 space-x-2">
        <button
          className={`px-4 py-2 rounded-l bg-blue-600 text-white ${useWebcam ? 'opacity-100' : 'opacity-50'}`}
          onClick={() => {
            setUseWebcam(true);
            setSelectedImage(null);
            setEmotion(null);
          }}
        >
          Webcam
        </button>
        <button
          className={`px-4 py-2 rounded-r bg-blue-600 text-white ${!useWebcam ? 'opacity-100' : 'opacity-50'}`}
          onClick={() => {
            setUseWebcam(false);
            setEmotion(null);
          }}
        >
          Image
        </button>
        {useWebcam && (
          <>
            <button
              className="ml-4 px-4 py-2 bg-gray-700 text-white rounded"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? "▶️ Reprendre" : "⏸️ Pause"}
            </button>
            <button
              className="ml-2 px-4 py-2 bg-red-600 text-white rounded"
              onClick={() => {
                if (videoStream) {
                  videoStream.getTracks().forEach((track) => track.stop());
                  setVideoStream(null);
                }
                setUseWebcam(false);
                setEmotion(null);
              }}
            >
              🛑 Stop Webcam
            </button>
          </>
        )}
      </div>

      {useWebcam ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            width="480"
            height="360"
            className="rounded-lg shadow-md"
          />
          <canvas
            ref={canvasRef}
            width="480"
            height="360"
            className="hidden"
          />
        </>
      ) : (
        <div className="w-full max-w-md text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0 file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
          {selectedImage && (
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Prévisualisation"
              className="rounded-md shadow-md mx-auto mb-4 max-h-64"
            />
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedImage}
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Analyse..." : "Analyser l'image"}
          </button>
        </div>
      )}

      {emotion && (
        <div className={`mt-6 text-xl font-bold ${emotionClass}`}>
          {emoji} Émotion détectée : {emotion}
        </div>
      )}

      {Object.keys(stats).length > 0 && (
        <div className="mt-8 w-72">
          <Pie data={chartData} />
          <p className="text-center text-sm text-gray-500 mt-2">Historique des émotions</p>
        </div>
      )}
    </div>
  );
}
