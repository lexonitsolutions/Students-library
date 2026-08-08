import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, MoreVertical, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconButton } from '../components/ui/IconButton';
import { materials, myUploads } from '../data/mockData';

const allMaterials = [...materials, ...myUploads];
const totalPages = 42;

export function ReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const material = allMaterials.find((item) => item.id === id) ?? allMaterials[0];
  const [page, setPage] = useState(4);
  const [zoom, setZoom] = useState(100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-card-border px-4 py-3 sm:px-6">
        <IconButton label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-semibold text-on-surface">{material.title}.pdf</p>
          <p className="text-label-sm text-on-surface-variant">Lexon University</p>
        </div>
        <div className="hidden items-center gap-1.5 text-label-sm text-on-surface-variant sm:flex">
          <span>Page</span>
          <input
            type="number"
            value={page}
            min={1}
            max={totalPages}
            onChange={(event) => setPage(Number(event.target.value))}
            className="h-8 w-12 rounded-md border border-card-border text-center"
            aria-label="Current page"
          />
          <span>/ {totalPages}</span>
        </div>
        <IconButton label="Search in document">
          <Search size={18} />
        </IconButton>
        <IconButton label="More options">
          <MoreVertical size={18} />
        </IconButton>
      </header>

      <div className="relative flex flex-1 items-center overflow-hidden bg-surface-container-low">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card text-on-surface-variant hover:text-on-surface cursor-pointer sm:left-4"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="mx-auto flex h-full w-full max-w-2xl items-center overflow-y-auto px-6 py-10 sm:px-12">
          <motion.article
            key={page}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: `${zoom}%` }}
            className="mx-auto w-full max-w-prose rounded-xl bg-white p-8 shadow-card"
          >
            <h2 className="text-headline-md text-on-surface">4.1 Cell Membrane Dynamics</h2>
            <p className="mt-4 text-body-md leading-relaxed text-on-surface-variant">
              The plasma membrane, or cell membrane, provides protection for a cell. It also provides a fixed
              environment inside the cell. That membrane has several different functions &mdash; one is to
              transport nutrients into the cell and also to transport toxic substances out of the cell.
            </p>
            <p className="mt-4 text-body-md leading-relaxed text-on-surface-variant">
              Cell membranes are selectively permeable, regulating the movement of substances in and out of the
              cell. This transport can be passive, occurring without the input of cellular energy, or active,
              requiring the cell to expend energy (typically in the form of ATP).
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-body-sm text-on-surface-variant">
              <li>
                <span className="font-semibold text-on-surface">Simple Diffusion:</span> Movement of small,
                nonpolar molecules down their concentration gradient.
              </li>
              <li>
                <span className="font-semibold text-on-surface">Facilitated Diffusion:</span> Transport of larger
                or charged molecules via specific transmembrane proteins.
              </li>
              <li>
                <span className="font-semibold text-on-surface">Active Transport:</span> Movement against a
                concentration gradient, requiring energy.
              </li>
            </ul>
          </motion.article>
        </div>

        <button
          type="button"
          aria-label="Next page"
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card text-on-surface-variant hover:text-on-surface cursor-pointer sm:right-4"
        >
          <ChevronRight size={20} />
        </button>

        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-inverse-surface px-3 py-1 text-label-sm text-inverse-on-surface sm:hidden">
          {page}
        </span>
      </div>

      <footer className="flex items-center justify-center gap-4 border-t border-card-border py-2.5">
        <IconButton label="Zoom out" onClick={() => setZoom((value) => Math.max(50, value - 10))}>
          <Minus size={18} />
        </IconButton>
        <span className="w-12 text-center text-label-sm text-on-surface-variant">{zoom}%</span>
        <IconButton label="Zoom in" onClick={() => setZoom((value) => Math.min(200, value + 10))}>
          <Plus size={18} />
        </IconButton>
      </footer>
    </div>
  );
}

export default ReaderPage;
