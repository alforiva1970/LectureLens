import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  MessageSquareText, 
  BookOpen, 
  Copy, 
  Printer, 
  Download, 
  AlertCircle, 
  Zap, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  MonitorDown, 
  Key, 
  HardDrive, 
  FolderOpen,
  X,
  MessageCircle,
  Sigma,
  Clock,
  Briefcase,
  Languages,
  Globe,
  Scale,
  GraduationCap,
  ShieldCheck,
  User,
  Send,
  Rocket,
  Heart,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Edit3,
  LogIn,
  RefreshCw,
  Coffee
} from 'lucide-react';
import * as UniversityService from '../../../services/UniversityService';
import { UniCourse, UniLesson } from '../../../services/UniversityService';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '../../../lib/utils';
import { extractAudio } from '../../../services/AudioExtractor';
import { extractFrames } from '../../../services/VisionExtractor';
import { 
  analyzeShortVideo, 
  analyzeFramesInChunks, 
  generateNotesLongVideo, 
  generateQuiz, 
  generateExtra,
  extractKeyConcepts,
  analyzeVideoThreePass
} from '../../../services/GeminiAPI';
import { SUBJECT_CONFIG, SubjectType } from '../../../constants/SubjectConfig';
import TutorChat from '../../../components/TutorChat';
import Preloader from '../../../components/Preloader';
import SetupWizard from '../../../components/SetupWizard';

// ... (tutto il resto del codice originale) ...
