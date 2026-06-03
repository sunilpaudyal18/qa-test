import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-t-transparent rounded-full"
        style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}
      />
    </div>
  );
}
