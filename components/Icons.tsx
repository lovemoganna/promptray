import {
  Code2,
  PenTool,
  Lightbulb,
  BarChart3,
  Smile,
  Box,
  LayoutGrid,
  Search,
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit3,
  X,
  Star,
  Zap,
  Download,
  Upload,
  Check,
  FileJson,
  Sparkles,
  CopyPlus,
  ClipboardCheck,
  Eye,
  Hash,
  Palette,
  LayoutDashboard,
  TrendingUp,
  Tag,
  Activity,
  Command,
  Laptop,
  Moon,
  Sun,
  Monitor,
  List,
  Cpu,
  History,
  RotateCcw,
  Menu,
  Archive,
  Wand2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Image,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Table,
  ChevronUp
} from 'lucide-react';

export const Icons = {
  Code: Code2,
  Writing: PenTool,
  Ideas: Lightbulb,
  Analysis: BarChart3,
  Fun: Smile,
  Misc: Box,
  All: LayoutGrid,
  Search,
  Plus,
  More: MoreHorizontal,
  Copy,
  CopyPlus,
  ClipboardCheck,
  Run: Zap,
  Delete: Trash2,
  Edit: Edit3,
  Close: X,
  Star,
  Download,
  Upload,
  Check,
  FileJson,
  Sparkles,
  Eye,
  Hash,
  Palette,
  Dashboard: LayoutDashboard,
  Trend: TrendingUp,
  Tag,
  Activity,
  Command,
  System: Laptop,
  Dark: Moon,
  Light: Sun,
  Theme: Monitor,
  List,
  Chip: Cpu,
  History,
  Restore: RotateCcw,
  Menu,
  Trash: Trash2,
  Archive,
  Magic: Wand2,
  Error: AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Image,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Table,
  ChevronUp
};

export const getIconForCategory = (category: string) => {
  switch (category) {
    case 'Code': return Icons.Code;
    case 'Writing': return Icons.Writing;
    case 'Ideas': return Icons.Ideas;
    case 'Analysis': return Icons.Analysis;
    case 'Fun': return Icons.Fun;
    case 'Misc': return Icons.Misc;
    case 'All': return Icons.All;
    case 'Trash': return Icons.Trash;
    default: return Icons.Hash;
  }
};

export const getColorForCategory = (category: string) => {
  switch (category) {
    case 'Code': return 'text-blue-400';
    case 'Writing': return 'text-purple-400';
    case 'Ideas': return 'text-yellow-400';
    case 'Analysis': return 'text-green-400';
    case 'Fun': return 'text-pink-400';
    default: return 'text-gray-400';
  }
};