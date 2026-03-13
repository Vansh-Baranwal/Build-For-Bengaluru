import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VoiceRecorder({ onRecordingComplete, onRemove }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast('Recording started...', { icon: '🎙️' });
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleRemove = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    onRemove();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50 border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Mic className="w-4 h-4 mr-2 text-blue-600" />
          Voice Description
        </label>
        {isRecording && (
          <span className="text-red-500 text-sm font-mono flex items-center animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            {formatTime(recordingTime)}
          </span>
        )}
      </div>

      {!audioUrl && !isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          className="w-full flex items-center justify-center py-6 border-2 border-dashed border-blue-400 rounded-xl text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition-all group scale-100 hover:scale-[1.01]"
        >
          <div className="bg-blue-100 p-3 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
            <Mic className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-left">
            <span className="block font-bold text-lg">Record Voice Complaint</span>
            <span className="block text-sm text-blue-500">Click to start recording your voice</span>
          </div>
        </button>
      ) : isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full flex items-center justify-center py-6 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 hover:bg-red-100 transition-all animate-pulse"
        >
          <div className="bg-red-200 p-3 rounded-full mr-4">
            <Square className="w-8 h-8 text-red-600 fill-current" />
          </div>
          <div className="text-left">
            <span className="block font-bold text-lg">Stop Recording</span>
            <span className="block text-sm text-red-500">Listening to your description...</span>
          </div>
        </button>
      ) : (
        <div className="flex items-center space-x-3 bg-white p-3 rounded-md border border-gray-200">
          <div className="flex-1">
            <audio src={audioUrl} controls className="w-full h-10" />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove recording"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">
        {isRecording 
          ? 'Speak clearly about the issue...' 
          : audioUrl 
            ? 'Playback to verify before submission.' 
            : 'Capture details quickly without typing.'}
      </p>
    </div>
  );
}
