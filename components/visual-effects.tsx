"use client"

import { useEffect, useState } from "react"
import {
  Heart,
  Star,
  Sparkles,
  Flower,
  Leaf,
  Circle,
  Triangle,
  Square,
  Diamond,
  CheckCircle,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Award,
  Target,
  TrendingUp,
} from "lucide-react"

export function VisualEffects() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Array of different particle types
  const particleIcons = [Star, Sparkles, Heart, Flower, Leaf, Circle, Triangle, Square, Diamond]

  // Array of floating icons
  const floatingIcons = [CheckCircle, DollarSign, Users, Calendar, Clock, Award, Target, TrendingUp]

  return (
    <>
      {/* Animated background shapes with 3D effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orbs with 3D gradient effects */}
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-pink-400/30 rounded-full blur-3xl animate-pulse shadow-2xl transform-gpu"
          style={{
            animation: "float 20s ease-in-out infinite, pulse 4s ease-in-out infinite",
            transform: "perspective(1000px) rotateX(15deg) rotateY(15deg)",
          }}
        />

        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/30 via-cyan-400/20 to-teal-400/30 rounded-full blur-3xl animate-pulse delay-1000 shadow-2xl transform-gpu"
          style={{
            animation: "float 25s ease-in-out infinite reverse, pulse 6s ease-in-out infinite",
            transform: "perspective(1000px) rotateX(-15deg) rotateY(-15deg)",
          }}
        />

        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/15 via-violet-400/10 to-rose-400/15 rounded-full blur-3xl animate-pulse delay-500 shadow-xl transform-gpu"
          style={{
            animation: "float 30s ease-in-out infinite, pulse 8s ease-in-out infinite",
            transform: "perspective(1000px) rotateX(10deg) rotateY(-10deg) translateX(-50%) translateY(-50%)",
          }}
        />

        {/* Additional smaller orbs for depth */}
        <div
          className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-2xl animate-bounce shadow-lg transform-gpu"
          style={{ animationDuration: "8s", animationDelay: "2s" }}
        />

        <div
          className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl animate-bounce shadow-lg transform-gpu"
          style={{ animationDuration: "6s", animationDelay: "4s" }}
        />
      </div>

      {/* Falling particles (flowers, stars, etc.) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const IconComponent = particleIcons[Math.floor(Math.random() * particleIcons.length)]
          const colors = [
            "text-pink-400/60",
            "text-purple-400/60",
            "text-blue-400/60",
            "text-cyan-400/60",
            "text-green-400/60",
            "text-yellow-400/60",
            "text-orange-400/60",
            "text-red-400/60",
            "text-indigo-400/60",
          ]
          const randomColor = colors[Math.floor(Math.random() * colors.length)]

          return (
            <div
              key={`falling-${i}`}
              className={`absolute ${randomColor} transform-gpu`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20 + 10}%`,
                animation: `fall ${15 + Math.random() * 20}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`,
                transform: `rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random() * 0.8})`,
                filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
              }}
            >
              <IconComponent
                className="w-4 h-4 animate-spin"
                style={{
                  animationDuration: `${3 + Math.random() * 4}s`,
                  animationDirection: Math.random() > 0.5 ? "normal" : "reverse",
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Floating icons with 3D hover effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => {
          const IconComponent = floatingIcons[i % floatingIcons.length]
          const positions = [
            { top: "10%", left: "15%" },
            { top: "20%", right: "10%" },
            { top: "40%", left: "5%" },
            { top: "60%", right: "20%" },
            { bottom: "30%", left: "10%" },
            { bottom: "20%", right: "15%" },
            { top: "70%", left: "80%" },
            { top: "30%", left: "70%" },
          ]
          const position = positions[i]

          return (
            <div
              key={`floating-${i}`}
              className="absolute transform-gpu"
              style={{
                ...position,
                animation: `floatIcon ${8 + Math.random() * 6}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                transform: "perspective(1000px) rotateX(15deg) rotateY(15deg)",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
              }}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-full blur-sm transform scale-150 group-hover:scale-200 transition-transform duration-500"></div>
                <IconComponent
                  className="w-6 h-6 text-blue-500/40 relative z-10 group-hover:text-blue-400/60 transition-colors duration-300"
                  style={{
                    animation: `pulse 3s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Twinkling stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white/60 rounded-full transform-gpu"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: "0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4)",
            }}
          />
        ))}
      </div>

      {/* Floating geometric shapes with 3D transforms */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => {
          const shapes = ["circle", "square", "triangle"]
          const shape = shapes[Math.floor(Math.random() * shapes.length)]
          const colors = [
            "bg-gradient-to-br from-pink-400/20 to-purple-400/20",
            "bg-gradient-to-br from-blue-400/20 to-cyan-400/20",
            "bg-gradient-to-br from-green-400/20 to-emerald-400/20",
            "bg-gradient-to-br from-yellow-400/20 to-orange-400/20",
          ]
          const randomColor = colors[Math.floor(Math.random() * colors.length)]

          return (
            <div
              key={`shape-${i}`}
              className={`absolute w-8 h-8 ${randomColor} transform-gpu`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                borderRadius: shape === "circle" ? "50%" : shape === "triangle" ? "0" : "4px",
                clipPath: shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
                animation: `floatShape ${10 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 8}s`,
                transform: `perspective(1000px) rotateX(${Math.random() * 60}deg) rotateY(${Math.random() * 60}deg) rotateZ(${Math.random() * 360}deg)`,
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.1))",
                backdropFilter: "blur(1px)",
              }}
            />
          )
        })}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: perspective(1000px) rotateX(15deg) rotateY(15deg) translateY(0px) scale(1); }
          50% { transform: perspective(1000px) rotateX(15deg) rotateY(15deg) translateY(-20px) scale(1.05); }
        }
        
        @keyframes fall {
          0% { 
            transform: translateY(-100vh) rotate(0deg) scale(0.8); 
            opacity: 0; 
          }
          10% { 
            opacity: 1; 
          }
          90% { 
            opacity: 1; 
          }
          100% { 
            transform: translateY(100vh) rotate(720deg) scale(1.2); 
            opacity: 0; 
          }
        }
        
        @keyframes floatIcon {
          0%, 100% { 
            transform: perspective(1000px) rotateX(15deg) rotateY(15deg) translateY(0px) translateX(0px) scale(1); 
          }
          25% { 
            transform: perspective(1000px) rotateX(20deg) rotateY(10deg) translateY(-15px) translateX(10px) scale(1.1); 
          }
          50% { 
            transform: perspective(1000px) rotateX(10deg) rotateY(20deg) translateY(-10px) translateX(-5px) scale(0.95); 
          }
          75% { 
            transform: perspective(1000px) rotateX(25deg) rotateY(5deg) translateY(-20px) translateX(-10px) scale(1.05); 
          }
        }
        
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(0.8); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2); 
          }
        }
        
        @keyframes floatShape {
          0%, 100% { 
            transform: perspective(1000px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateY(0px); 
          }
          25% { 
            transform: perspective(1000px) rotateX(90deg) rotateY(45deg) rotateZ(90deg) translateY(-20px); 
          }
          50% { 
            transform: perspective(1000px) rotateX(180deg) rotateY(90deg) rotateZ(180deg) translateY(-10px); 
          }
          75% { 
            transform: perspective(1000px) rotateX(270deg) rotateY(135deg) rotateZ(270deg) translateY(-30px); 
          }
        }
      `}</style>
    </>
  )
}
