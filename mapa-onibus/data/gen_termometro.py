#!/usr/bin/env python3
"""Inclui o bloco 'termometro' em data/noticias-secretarias.json a partir de pautas.json.

O índice é o mesmo do mapa 'Pautas de Foz agora' (nivel 0–100 de problemas).
Não recalcula métricas; só copia os valores já publicados em pautas.json.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # mapa-onibus
PAUTAS = ROOT.parent / "pautas.json"
NEWS = Path(__file__).resolve().parent / "noticias-secretarias.json"

ORGAO_MAP = {
    "prefeitura": "gabinete",
    "administracao": "administracao",
    "fundacao": "cultura",
    "meio_ambiente": "meio_ambiente",
    "obras": "obras",
    "educacao": "educacao",
    "planejamento": "planejamento",
    "hospital": "hospital",
    "fozhabita": "fozhabita",
    "foztrans": "foztrans",
    "turismo": "turismo",
    "guarda": "seguranca",
    "financas": "financas",
    "esporte": "esporte",
    "saude": "saude",
}


def build(pautas: dict) -> dict:
    by = {o["id"]: o for o in pautas.get("orgaos") or []}
    secs = {}
    niveis = []
    incluidas = []
    prob_sum = pos_sum = 0
    for btn, oid in ORGAO_MAP.items():
        o = by.get(oid)
        if not o:
            secs[btn] = {
                "id": btn,
                "orgao": oid,
                "nivel": None,
                "nivel_base": None,
                "estrelas": None,
                "problemas": 0,
                "positivas": 0,
                "sem_indice": True,
            }
            continue
        rec = {
            "id": btn,
            "orgao": oid,
            "nome": o["nome"],
            "nivel": o["nivel"],
            "nivel_base": o["nivel_base"],
            "estrelas": o["estrelas"],
            "problemas": len(o.get("problemas") or []),
            "positivas": len(o.get("positivas") or []),
            "sem_indice": False,
        }
        secs[btn] = rec
        niveis.append(o["nivel"])
        incluidas.append(btn)
        prob_sum += rec["problemas"]
        pos_sum += rec["positivas"]
    return {
        "atualizado": pautas.get("atualizado"),
        "periodo": pautas.get("periodo"),
        "fonte": "pautas.json (Pautas de Foz agora)",
        "regra": (
            "Indice 0-100 de problemas, igual ao mapa Pautas de Foz agora. "
            "O ponteiro vai a esquerda (vermelho) com mais problemas e a direita (verde) com menos. "
            "Noticias positivas nao movem o indice (no outro mapa viram estrelas)."
        ),
        "cidade": {
            "id": "cidade",
            "nome": "Foz do Iguaçu",
            "nivel": round(sum(niveis) / len(niveis)) if niveis else None,
            "modo": "media_aritmetica_secretarias_com_indice",
            "n_secretarias": len(niveis),
            "secretarias": incluidas,
            "problemas": prob_sum,
            "positivas": pos_sum,
        },
        "secretarias": secs,
    }


def main() -> None:
    pautas = json.loads(PAUTAS.read_text())
    news = json.loads(NEWS.read_text())
    news["termometro"] = build(pautas)
    NEWS.write_text(json.dumps(news, ensure_ascii=False, indent=2) + "\n")
    c = news["termometro"]["cidade"]
    print(f"cidade {c['nivel']}/100  n={c['n_secretarias']}  problemas={c['problemas']}  positivas={c['positivas']}")


if __name__ == "__main__":
    main()
