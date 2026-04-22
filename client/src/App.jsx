import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Folder,
  File,
  Search,
  LayoutGrid,
  List,
  Plus,
  Clock,
  Star,
  Trash2,
  Settings,
  Users,
  ChevronRight,
  HardDrive,
  FileText,
  LogIn,
  Pencil,
  Download,
  Info
} from 'lucide-react';
import './App.css';
import './Login.css';

import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import Login from './Login';

// Configuração dinâmica para acesso via rede
const API_URL = `http://${window.location.hostname}:3002`;

function App() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [activeNav, setActiveNav] = useState('files');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageInfo, setStorageInfo] = useState({ used: 0, limit: 10 * 1024 * 1024 * 1024, percent: 0 });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('drive_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('drive_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (file, e) => {
    if (e) e.stopPropagation();
    const fileId = `${currentPath}/${file.name}`;
    setFavorites(prev => {
      const isStarred = prev.some(f => f.id === fileId);
      if (isStarred) {
        return prev.filter(f => f.id !== fileId);
      } else {
        return [...prev, { ...file, id: fileId, path: currentPath }];
      }
    });
  };

  useEffect(() => {
    // Verificar sessão manual no localStorage
    const savedUser = localStorage.getItem('drive_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('drive_user');
    setUser(null);
  };

  const fetchStorageInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/storage-info`);
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Erro ao buscar info de armazenamento:', error);
    }
  };



  const fetchFiles = async (path = currentPath) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/files?folder=${encodeURIComponent(path)}`);
      setFiles(response.data);
      setLoading(false);
      fetchStorageInfo(); // Atualizar storage sempre que mudar de pasta ou atualizar
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    setSelectedFile(null);
    setShowDetails(false);
    setSearchQuery('');
  }, [currentPath]);

  const handleFolderClick = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  const handleFileSelect = (file, e) => {
    e.stopPropagation();
    setSelectedFile(file);
    setShowDetails(true);
  };

  const handleDownload = async (fileToDownload = selectedFile) => {
    if (!fileToDownload || fileToDownload.isDirectory) return;

    const url = `${API_URL}/api/download?file=${encodeURIComponent(fileToDownload.name)}&folder=${encodeURIComponent(currentPath)}`;

    try {
      const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileToDownload.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Não foi possível baixar o arquivo.');
    }
  };

  const handleRename = async () => {
    if (!selectedFile) return;

    // Separar nome da extensão
    const lastDotIndex = selectedFile.name.lastIndexOf('.');
    let nameWithoutExt = selectedFile.name;
    let extension = '';

    if (!selectedFile.isDirectory && lastDotIndex !== -1) {
      nameWithoutExt = selectedFile.name.substring(0, lastDotIndex);
      extension = selectedFile.name.substring(lastDotIndex);
    }

    const newBaseName = prompt('Novo nome:', nameWithoutExt);
    if (!newBaseName || newBaseName === nameWithoutExt) return;

    const newFullName = extension ? `${newBaseName}${extension}` : newBaseName;

    try {
      await axios.post(`${API_URL}/api/rename`, {
        oldName: selectedFile.name,
        newName: newFullName,
        folder: currentPath
      });
      fetchFiles();
      setSelectedFile(null);
    } catch (error) {
      console.error('Erro ao renomear:', error);
    }
  };

  const handleDelete = async (fileToDelete = selectedFile) => {
    if (!fileToDelete) return;

    // Verificar permissão
    if (user?.role !== 'admin') {
      alert('Apenas administradores podem excluir arquivos.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir "${fileToDelete.name}"?`)) return;

    try {
      await axios.post(`${API_URL}/api/delete`, {
        name: fileToDelete.name,
        folder: currentPath
      });
      fetchFiles();
      setSelectedFile(null);
      setShowDetails(false);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir o item.');
    }
  };

  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      setCurrentPath('');
      return;
    }
    const pathParts = currentPath.split('/');
    const newPath = pathParts.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/api/upload?folder=${encodeURIComponent(currentPath)}&owner=${encodeURIComponent(user.username || user.email)}`, formData);
      fetchFiles();
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nome da nova pasta:');
    if (!name) return;

    try {
      await axios.post(`${API_URL}/api/mkdir`, {
        name,
        folder: currentPath,
        owner: user.username || user.email
      });
      fetchFiles();
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
    }
  };

  const breadcrumbs = currentPath ? currentPath.split('/') : [];

  // Decidir quais arquivos mostrar baseado na aba ativa
  const getDisplayedFiles = () => {
    if (activeNav === 'starred') {
      return favorites.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const displayedFiles = getDisplayedFiles();

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="app-container" onClick={() => { setSelectedFile(null); setShowDetails(false); }}>
      {/* Sidebar */}
      <aside className="sidebar glass-effect" onClick={(e) => e.stopPropagation()}>
        <div className="logo">
          <div className="logo-icon">D</div>
          <span>InfoDrive</span>
        </div>

        <div className="new-menu-container">
          <button className="new-btn" onClick={() => document.getElementById('file-upload').click()}>
            <Plus size={20} />
            <span>Upload</span>
          </button>
          <button className="new-btn-alt" onClick={handleCreateFolder}>
            <Folder size={20} />
            <span>Nova Pasta</span>
          </button>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
        </div>

        <nav className="side-nav">
          <button
            className={`nav-item ${activeNav === 'files' ? 'active' : ''}`}
            onClick={() => { setActiveNav('files'); setCurrentPath(''); }}
          >
            <Folder size={20} />
            <span>Meus Arquivos</span>
          </button>
          <button
            className={`nav-item ${activeNav === 'starred' ? 'active' : ''}`}
            onClick={() => setActiveNav('starred')}
          >
            <Star size={20} />
            <span>Favoritos</span>
          </button>
          <div className="nav-divider"></div>
          <button className="nav-item logout" onClick={handleLogout}>
            <LogIn size={20} style={{ transform: 'rotate(180deg)' }} />
            <span>Sair</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-avatar">
              {(user.username || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user.username || 'Usuário'}</span>
              <span className="user-email">{user.email || 'No e-mail'}</span>
            </div>
          </div>

          <div className="storage-info">
            <div className="storage-header">
              <HardDrive size={16} />
              <span>Armazenamento</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${storageInfo.percent}%` }}></div>
            </div>
            <span className="storage-text">
              {formatSize(storageInfo.used)} de {formatSize(storageInfo.limit)} usados
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header glass-effect">
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="toolbar"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="selection-toolbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="selection-left">
                  <button className="close-selection" onClick={() => { setSelectedFile(null); setShowDetails(false); }}>
                    <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                  </button>
                  <span className="selection-count">1 item selecionado</span>
                </div>

                <div className="toolbar-actions">
                  {!selectedFile.isDirectory && (
                    <button className="icon-btn" onClick={() => handleDownload()} title="Baixar">
                      <Download size={20} />
                    </button>
                  )}
                  <button className="icon-btn" onClick={handleRename} title="Renomear">
                    <Pencil size={20} />
                  </button>
                  <button className={`icon-btn ${showDetails ? 'active' : ''}`} onClick={() => setShowDetails(!showDetails)} title="Ver Detalhes">
                    <Info size={20} />
                  </button>
                  {user?.role === 'admin' && (
                    <button className="icon-btn danger" onClick={() => handleDelete()} title="Excluir">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="search-bar"
              >
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar arquivos nesta pasta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="header-actions">
            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={20} />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </header>

        <div className="content-area">
          <div className="breadcrumbs">
            <span className="breadcrumb-item" onClick={() => navigateToBreadcrumb(-1)}>Meus Arquivos</span>
            {breadcrumbs.map((part, i) => (
              <React.Fragment key={i}>
                <ChevronRight size={16} />
                <span
                  className={`breadcrumb-item ${i === breadcrumbs.length - 1 ? 'current' : ''}`}
                  onClick={() => navigateToBreadcrumb(i)}
                >
                  {part}
                </span>
              </React.Fragment>
            ))}
          </div>

          {loading ? (
            <div className="loading">Carregando arquivos...</div>
          ) : (
            <motion.div layout className={`file-explorer ${viewMode}`}>
              {displayedFiles.length === 0 && (
                <div className="empty-state">
                  {searchQuery ? 'Nenhum arquivo corresponde à busca' :
                    activeNav === 'starred' ? 'Você ainda não marcou nenhum favorito' : 'Nenhum arquivo encontrado'}
                </div>
              )}
              <AnimatePresence>
                {displayedFiles.map((file, i) => {
                  const isStarred = favorites.some(f => f.id === `${activeNav === 'starred' ? file.path : currentPath}/${file.name}`);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={file.id || file.name}
                      className={`file-card glass-effect ${selectedFile?.name === file.name ? 'selected' : ''}`}
                      onClick={(e) => handleFileSelect(file, e)}
                      onDoubleClick={() => {
                        if (file.isDirectory) {
                          if (activeNav === 'starred') {
                            setCurrentPath(file.path);
                            // Pequeno delay para garantir que a navegação ocorra antes de abrir a subpasta se necessário
                            setTimeout(() => handleFolderClick(file.name), 10);
                          } else {
                            handleFolderClick(file.name);
                          }
                        }
                      }}
                    >
                      <div className="card-actions-top">
                        <button
                          className={`card-star-btn ${isStarred ? 'active' : ''}`}
                          onClick={(e) => toggleFavorite(file, e)}
                          title={isStarred ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <Star size={18} fill={isStarred ? "currentColor" : "none"} />
                        </button>

                        {!file.isDirectory && (
                          <button
                            className="card-download-btn"
                            onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                            title="Baixar"
                          >
                            <Download size={18} />
                          </button>
                        )}
                      </div>

                      <div className={`file-icon ${file.isDirectory ? 'folder' : 'document'}`}>
                        {file.isDirectory ? (
                          <Folder size={48} fill="currentColor" />
                        ) : (
                          <FileText size={48} />
                        )}
                      </div>
                      <div className="file-info">
                        <span className="file-name" title={file.name}>{file.name}</span>
                        <span className="file-meta">
                          {file.isDirectory ? 'Pasta' : formatSize(file.size)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Details Sidebar */}
      <AnimatePresence>
        {showDetails && selectedFile && (
          <motion.aside
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="details-panel glass-effect"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="details-header">
              <h3>Detalhes</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <div className="details-preview">
              <div className={`preview-icon ${selectedFile.isDirectory ? 'folder' : 'document'}`}>
                {selectedFile.isDirectory ? (
                  <Folder size={64} fill="currentColor" />
                ) : (
                  <FileText size={64} />
                )}
              </div>
              <span className="preview-name">{selectedFile.name}</span>
            </div>

            <div className="details-info">
              <div className="info-group">
                <label>Tipo</label>
                <span>{selectedFile.isDirectory ? 'Pasta' : 'Arquivo'}</span>
              </div>
              <div className="info-group">
                <label>Tamanho</label>
                <span>{selectedFile.isDirectory ? '--' : formatSize(selectedFile.size)}</span>
              </div>
              <div className="info-group">
                <label>Criado em</label>
                <span>{formatDate(selectedFile.createdAt)}</span>
              </div>
              <div className="info-group">
                <label>Proprietário</label>
                <span>{selectedFile.owner || 'Sistema'}</span>
              </div>
              <div className="info-group">
                <label>Localização</label>
                <span>{currentPath || 'Raiz'}</span>
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="details-actions" style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <button className="action-btn danger" onClick={() => handleDelete()} style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <Trash2 size={18} />
                  Excluir Permanentemente
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
