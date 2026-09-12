'use client';
import {ReactNode} from 'react';

export default function Modal({title, onClose, children}:{title:string; onClose:()=>void; children:ReactNode}){
  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalBox" onClick={e=>e.stopPropagation()}>
        <div className="modalHead">
          <h2>{title}</h2>
          <button type="button" className="modalClose" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
