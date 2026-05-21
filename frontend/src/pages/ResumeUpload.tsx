import { useState, useRef, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAPI } from '../api/client';
import type { ResumeUploadResponse } from '../types';
import { PaywallOverlay, useSubscription } from '../modules/subscription';
import { ResumeIllustration } from '../components/Illustrations';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
  Briefcase, GraduationCap, Wrench, Copy, Check, Flower2,
} from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';
import { ConfettiBurst } from '../components/Animations';

const cItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function ResumeUpload() {
  const { plan, usageCount, incrementUsage, getFeatureGate } = useSubscription();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ResumeUploadResponse | null>(null);
  const [error, setError] = useState('');
  const [showUploadPaywall, setShowUploadPaywall] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadLocked = plan !== 'pro' && usageCount >= 1;

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped?.type === 'application/pdf') { setFile(dropped); setError(''); setShowUploadPaywall(false); }
    else setError('Only PDF files are accepted');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(''); setShowUploadPaywall(false); }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (uploadLocked) {
      setShowUploadPaywall(true);
      setError('');
      return;
    }
    setUploading(true); setError(''); setResult(null);
    try {
      const { data } = await resumeAPI.upload(file);
      setResult(data);
      incrementUsage();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 402 || detail?.isLocked) {
        setShowUploadPaywall(true);
        setError('');
      } else {
        setError(err.response?.data?.message || detail || 'Upload failed');
      }
    } finally { setUploading(false); }
  };

  const handleUploadAnother = () => {
    if (uploadLocked) {
      setShowUploadPaywall(true);
      return;
    }
    setFile(null);
    setResult(null);
  };

  const copyId = () => {
    if (result?.id) {
      navigator.clipboard.writeText(result.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={cItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-bark flex items-center gap-2">
            <FileText className="w-6 h-6 text-warm-500" />
            Resume Upload
          </h1>
          <p className="mt-1 text-dusk">Upload your PDF resume for AI-powered analysis</p>
        </div>
        <div className="hidden sm:block">
          <ResumeIllustration size={140} />
        </div>
      </motion.div>

      {/* Upload zone */}
      <AnimatePresence mode="wait">
        {!result && (
          <motion.div
            key="upload"
            variants={cItem}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`card cursor-pointer flex flex-col items-center justify-center py-16 transition-all duration-300 border-2 border-dashed ${
              dragActive ? 'border-warm-400 bg-warm-50/50' : 'border-warm-200 hover:border-warm-300 hover:bg-warm-50/30'
            }`}
          >
            <input ref={inputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
            {file ? (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-warm-600" />
                  </div>
                </motion.div>
                <p className="text-lg font-display font-bold text-bark">{file.name}</p>
                <p className="text-sm mt-1 text-dusk">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                  <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-warm-400" />
                  </div>
                </motion.div>
                <p className="text-lg font-display font-semibold text-bark">Drop your resume here or click to browse</p>
                <p className="text-sm mt-1 text-dusk">PDF files up to 10 MB</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /><span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {showUploadPaywall && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative min-h-[290px]">
          <div className="card pointer-events-none select-none opacity-50 blur-[2px]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-100">
                <Upload className="h-6 w-6 text-warm-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-bark">Analyze another resume</h3>
                <p className="text-sm text-dusk">Compare versions, track progress, and keep improving your odds.</p>
              </div>
            </div>
          </div>
          <PaywallOverlay feature="resume_upload" gate={getFeatureGate('resume_upload')} />
        </motion.div>
      )}

      {/* Upload button */}
      {file && !result && (
        <motion.div variants={cItem} className="relative inline-block">
          <AnimatedButton
            onClick={handleUpload}
            loading={uploading}
            success={!!result}
            loadingText="Processing..."
            successText="Uploaded!"
            loaderStyle="dots"
            icon={<Upload className="w-4 h-4" />}
          >
            Upload & Process
          </AnimatedButton>
          <ConfettiBurst show={!!result} />
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 relative">
            {/* Success confetti */}
            <ConfettiBurst show={true} />
            {/* Success */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-green-50 border border-green-200 success-pulse"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-bold text-green-700">Resume processed successfully</p>
                <p className="text-xs text-green-600/70">Status: {result.status}</p>
              </div>
            </motion.div>

            {/* Resume ID */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label mb-0">Resume ID</p>
                  <p className="text-sm font-mono mt-1 text-warm-600">{result.id}</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={copyId} className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </motion.button>
              </div>
              <p className="text-xs mt-2 text-dusk">You'll need this ID for rejection analysis, simulation, and blueprint generation.</p>
            </div>

            {/* Skills */}
            {(result.structured_data?.skills?.length ?? 0) > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="w-4.5 h-4.5 text-warm-500" />
                  <h3 className="font-display font-bold text-bark">Extracted Skills</h3>
                  <span className="bg-warm-100 text-warm-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{result.structured_data!.skills.length} found</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.structured_data!.skills.map((s) => (
                    <span key={s.name} className="skill-tag">{s.name}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Experience */}
            {result.structured_data && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4.5 h-4.5 text-sky-500" />
                  <h3 className="font-display font-bold text-bark">Experience</h3>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-3xl font-display font-black text-sky-500">{result.structured_data.total_experience_years ?? '—'}</p>
                    <p className="text-xs text-dusk">Years</p>
                  </div>
                  <div>
                    <p className="text-3xl font-display font-black text-sky-500 capitalize">{result.structured_data.experience_level ?? '—'}</p>
                    <p className="text-xs text-dusk">Level</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Education */}
            {result.structured_data?.education && result.structured_data.education.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4.5 h-4.5 text-violet-500" />
                  <h3 className="font-display font-bold text-bark">Education</h3>
                </div>
                <ul className="space-y-1">
                  {result.structured_data.education.map((edu, i) => (
                    <li key={i} className="text-sm text-bark">{[edu.degree, edu.field_of_study, edu.institution, edu.year].filter(Boolean).join(' — ')}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Upload another */}
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleUploadAnother}
              className="btn-secondary">
              Upload Another Resume
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
