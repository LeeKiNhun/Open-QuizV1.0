import React from "react";
import { Link } from "react-router-dom";
import "./Breadcrumb.css";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="oq-bc" aria-label="breadcrumb">
      <ol className="oq-bc__list">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          const key = it.to || `${it.label}-${idx}`;

          return (
            <li className="oq-bc__item" key={key}>
              {isLast || !it.to ? (
                <span className="oq-bc__active">{it.label}</span>
              ) : (
                <Link className="oq-bc__link" to={it.to}>
                  {it.label}
                </Link>
              )}
              {!isLast && <span className="oq-bc__sep">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}