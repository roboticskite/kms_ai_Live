import { X, Images, Play, Heart, Repeat2, Plus, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import type { ProjectData } from "../types";

interface Props {
  onClose: () => void;
  onPlayProject?: (project: ProjectData) => void;
}

export default function GalleryPanel({ onClose, onPlayProject }: Props) {
  const { galleryProjects, toggleGalleryLike, setProject, project, publishToGallery } = useEditorStore();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishName, setPublishName] = useState(project.projectName || "My Creation");
  const [publishAuthor, setPublishAuthor] = useState("Kite Coder");
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handlePlay = (projData: ProjectData) => {
    setProject(projData);
    onClose();
    if (onPlayProject) {
      onPlayProject(projData);
    }
  };

  const handleRemix = (projData: ProjectData) => {
    const remixed: ProjectData = {
      ...JSON.parse(JSON.stringify(projData)),
      projectName: `${projData.projectName} (Remix)`,
      updatedAt: Date.now(),
    };
    setProject(remixed);
    onClose();
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishName.trim()) return;
    const projectToPublish: ProjectData = {
      ...project,
      projectName: publishName.trim(),
    };
    publishToGallery(projectToPublish, publishAuthor.trim() || "Anonymous");
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishSuccess(false);
      setShowPublishModal(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-kite-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Images size={22} className="text-kite-600" />
            <span className="font-bold text-lg text-gray-800">Project Gallery</span>
            <span className="text-xs bg-kite-100 text-kite-700 font-semibold px-2 py-0.5 rounded-full ml-2">
              {galleryProjects.length} Projects
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary text-sm gap-1.5" onClick={() => setShowPublishModal(true)}>
              <Plus size={16} /> Publish Current
            </button>
            <button className="btn-ghost p-1.5" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Publish Dialog */}
        {showPublishModal && (
          <div className="p-4 bg-kite-50 border-b border-kite-100 animate-slide-up">
            <form onSubmit={handlePublishSubmit} className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Project Name</label>
                <input
                  type="text"
                  value={publishName}
                  onChange={(e) => setPublishName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-kite-500"
                  placeholder="Name your project"
                  required
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Creator Name</label>
                <input
                  type="text"
                  value={publishAuthor}
                  onChange={(e) => setPublishAuthor(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-kite-500"
                  placeholder="Your nickname"
                  required
                />
              </div>
              <div className="flex gap-2 self-end mt-2 sm:mt-0">
                <button type="submit" className="btn-primary text-xs py-2 px-3 font-semibold">
                  {publishSuccess ? <Check size={14} className="text-green-300" /> : <Sparkles size={14} />}
                  {publishSuccess ? "Published!" : "Publish Now"}
                </button>
                <button type="button" className="btn-ghost text-xs py-2 px-2" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {galleryProjects.map((p) => {
              const previewBackdrop = p.projectData?.backdrops?.[p.projectData.currentBackdrop]?.dataUrl;
              const previewCostume = p.projectData?.sprites?.[0]?.costumes?.[0]?.dataUrl;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all group bg-white flex flex-col"
                >
                  <div className="aspect-video bg-gradient-to-br from-kite-100 to-purple-100 relative flex items-center justify-center overflow-hidden">
                    {previewBackdrop && (
                      <img src={previewBackdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    {previewCostume ? (
                      <img src={previewCostume} alt={p.name} className="w-16 h-16 object-contain z-10 transition-transform group-hover:scale-110" />
                    ) : (
                      <img src={`${import.meta.env.BASE_URL}kite.svg`} alt={p.name} className="w-14 h-14 opacity-50 z-10" />
                    )}

                    <div className="absolute inset-0 bg-black/40 group-hover:opacity-100 opacity-0 transition-all flex items-center justify-center gap-2 z-20 backdrop-blur-[2px]">
                      <button
                        className="btn-success text-xs py-1.5 px-3 shadow-lg"
                        onClick={() => handlePlay(p.projectData)}
                        title="Play game"
                      >
                        <Play size={15} fill="currentColor" /> Play
                      </button>
                      <button
                        className="btn-primary text-xs py-1.5 px-3 shadow-lg"
                        onClick={() => handleRemix(p.projectData)}
                        title="Edit project"
                      >
                        <Repeat2 size={15} /> Remix
                      </button>
                    </div>
                  </div>
                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm truncate">{p.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">by {p.creator}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                          p.liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                        }`}
                        onClick={() => toggleGalleryLike(p.id)}
                      >
                        <Heart size={15} fill={p.liked ? "currentColor" : "none"} />
                        <span>{p.likes}</span>
                      </button>
                      <button
                        className="text-xs font-bold text-kite-600 hover:text-kite-800 flex items-center gap-1"
                        onClick={() => handleRemix(p.projectData)}
                      >
                        <Repeat2 size={13} /> Open Code
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
