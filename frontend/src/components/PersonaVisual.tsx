import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface PersonaVisualProps {
  avatar: string;
  name: string;
  role: string;
  isActive: boolean;
  progress: number;
  description: string;
}

export const PersonaVisual: React.FC<PersonaVisualProps> = ({
  avatar,
  name,
  role,
  isActive,
  progress,
  description,
}) => {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100
      }
    },
    active: {
      scale: 1.05,
      boxShadow: "0px 0px 20px rgba(124, 77, 255, 0.4)",
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 200
      }
    }
  };

  const progressVariants = {
    initial: { width: "0%" },
    animate: { 
      width: `${progress}%`,
      transition: { duration: 1, ease: "easeInOut" }
    }
  };

  const avatarVariants = {
    inactive: { scale: 1, rotate: 0 },
    active: {
      scale: [1, 1.2, 1],
      rotate: [0, 360],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate={isActive ? "active" : "visible"}
        variants={containerVariants}
        layout
      >
        <Box
          sx={{
            padding: '1.5rem',
            background: isActive 
              ? 'linear-gradient(135deg, rgba(124, 77, 255, 0.2) 0%, rgba(245, 0, 87, 0.2) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            width: '280px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
          }}
        >
          <motion.div
            variants={avatarVariants}
            animate={isActive ? "active" : "inactive"}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                marginRight: '1rem',
                filter: isActive ? 'drop-shadow(0 0 10px rgba(124, 77, 255, 0.5))' : 'none'
              }}
            >
              {avatar}
            </Typography>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1.2rem',
                  textShadow: isActive ? '0 0 10px rgba(124, 77, 255, 0.5)' : 'none'
                }}
              >
                {name}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {role}
              </Typography>
            </Box>
          </motion.div>

          <Box sx={{ position: 'relative', marginBottom: '1rem' }}>
            <LinearProgress
              variant="determinate"
              value={100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #7c4dff 30%, #f50057 90%)',
                  borderRadius: 4,
                },
              }}
            />
            <motion.div
              initial="initial"
              animate="animate"
              variants={progressVariants}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                background: 'linear-gradient(45deg, #7c4dff 30%, #f50057 90%)',
                borderRadius: 4,
              }}
            />
          </Box>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.85rem',
                textAlign: 'center',
                lineHeight: 1.6,
                fontWeight: 500,
                textShadow: isActive ? '0 0 10px rgba(124, 77, 255, 0.3)' : 'none'
              }}
            >
              {description}
            </Typography>
          </motion.div>

          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                background: 'linear-gradient(45deg, #7c4dff 30%, #f50057 90%)',
                borderRadius: '50%',
                padding: '8px',
                boxShadow: '0 0 10px rgba(124, 77, 255, 0.5)'
              }}
            >
              <Typography sx={{ color: 'white', fontSize: '0.8rem' }}>
                Active
              </Typography>
            </motion.div>
          )}
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};