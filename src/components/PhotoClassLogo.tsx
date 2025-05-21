
import { Camera } from 'lucide-react';

export function PhotoClassLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
        {/* Using a Camera icon instead of text for a more generic logo placeholder, or use Pacifico font if preferred */}
        <span className="font-pacifico text-xl">PC</span>
      </div>
      <h1 className="ml-1 font-bold text-xl text-foreground font-sans">PhotoClass</h1>
    </div>
  );
}
