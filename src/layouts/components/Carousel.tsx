import { useEffect, useState } from "react";

// Importar todas las imágenes de la galería
const imageModules = import.meta.glob("/src/assets/images/gallery/*", {
  eager: true,
});
const images = Object.values(imageModules).map((module: any) => module.default);

// Duplicar el array para efecto infinito
const duplicatedImages = [...images, ...images];

const Carousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Cambiar cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden w-full h-48 md:h-64 lg:h-80">
      <div
        className="flex transition-transform duration-1000 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {duplicatedImages.map((src, index) => (
          <div key={index} className="flex-shrink-0 w-full h-full">
            <img
              src={src}
              alt={`Imagen de galería ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
