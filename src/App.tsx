import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Upload, Leaf, AlertCircle, CheckCircle2, Loader2, Camera, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SYSTEM_INSTRUCTION = `You are a world-class plant pathology expert. 
Your goal is to analyze leaf images and provide clear, structured advice for farmers and students.
Use simple language. 

Structure your response with these exact headings:
- Plant Name
- Disease Status
- Disease Name & Confidence Score
- Confidence Explanation
- Causes
- Treatment
- Prevention

If the leaf is healthy, confirm it and provide general care tips.
If diseased:
1. Identify the exact disease name.
2. Provide a confidence score (e.g., 'High', 'Medium', 'Low' or a percentage) alongside the disease name.
3. In 'Confidence Explanation', briefly explain what this score indicates about the accuracy of the diagnosis based on the image quality, visible symptoms, or potential ambiguities.
4. Explain symptoms visible in the image.
5. Suggest practical treatments and preventive measures.

Use Google Search to ensure your information about treatments and diseases is up-to-date and accurate.`;

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeLeaf = async () => {
    if (!image) return;

    setAnalyzing(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
              {
                text: "Analyze this leaf image. Identify the plant, check for diseases, and provide a structured report according to your instructions.",
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });

      setResult(response.text || "No analysis could be generated.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze the image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-xl">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-serif font-bold text-stone-800 tracking-tight">LeafDoc</h1>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400 hidden sm:block">
            Plant Pathology Expert
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid gap-8">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-stone-900 leading-tight">
              Heal your plants with <span className="text-emerald-700 italic">AI precision</span>.
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Upload a photo of a leaf to identify diseases and get expert treatment advice instantly.
            </p>
          </section>

          {/* Upload Area */}
          <section>
            {!image ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-stone-300 rounded-3xl p-12 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer bg-white"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <Upload className="w-8 h-8 text-stone-400 group-hover:text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-medium text-stone-800">Click or drag leaf image</p>
                    <p className="text-stone-500">Supports JPG, PNG, WEBP</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-stone-200 aspect-video bg-stone-100">
                  <img
                    src={image}
                    alt="Uploaded leaf"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-600" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={analyzeLeaf}
                    disabled={analyzing}
                    className="flex items-center justify-center gap-2 bg-emerald-700 text-white px-8 py-4 rounded-2xl font-medium text-lg hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Leaf...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        Start Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Results Section */}
          {(result || error) && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-stone-100 border border-stone-100">
                {error ? (
                  <div className="flex items-start gap-4 text-red-600 bg-red-50 p-6 rounded-2xl">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 pb-6 border-b border-stone-100">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-stone-800">Analysis Report</h3>
                    </div>
                    
                    <div className="markdown-body">
                      <ReactMarkdown>{result!}</ReactMarkdown>
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm text-stone-400 italic">
                        * Analysis provided by AI. Consult a local expert for critical decisions.
                      </p>
                      <button
                        onClick={() => window.print()}
                        className="text-sm font-medium text-emerald-700 hover:underline"
                      >
                        Download Report (PDF)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-stone-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Leaf className="w-4 h-4" />
            <span className="text-sm font-serif font-bold">LeafDoc</span>
          </div>
          <div className="flex gap-8 text-sm text-stone-400">
            <a href="#" className="hover:text-stone-600 transition-colors">About</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} LeafDoc AI. Empowering agriculture.
          </p>
        </div>
      </footer>
    </div>
  );
}
