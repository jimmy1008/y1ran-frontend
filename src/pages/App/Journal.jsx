// frontend/src/pages/App/Journal.jsx
import React from "react";
import "./Journal.css";

export default function Journal() {
  return (
    <div className="jBoardMain">
      <div className="jTopSpan">
        <div className="jTitle">儀表板</div>
        <div className="jTabs">
          <button className="jTab isActive" type="button">全部</button>
          <button className="jTab" type="button">今天</button>
          <button className="jTab" type="button">本週</button>
          <button className="jTab" type="button">已結單</button>
        </div>
      </div>

      <div className="jMetaRow">
        <div className="jMetaGrid">
          <div className="jMetaCard">
            <div className="jMetaLabel">今日建立</div>
            <div className="jMetaValue">0</div>
          </div>
          <div className="jMetaCard">
            <div className="jMetaLabel">交易所</div>
            <div className="jMetaValue">Binance</div>
          </div>
          <div className="jMetaCard">
            <div className="jMetaLabel">狀態</div>
            <div className="jMetaValue">草稿</div>
          </div>
          <div className="jMetaCard">
            <div className="jMetaLabel">（留空）</div>
            <div className="jMetaValue">&nbsp;</div>
          </div>
        </div>
      </div>

      <div className="jCenterRow">
        <div className="jMain">
          <div className="jCardsRow">
            <div className="jCard">
              <div className="jCover" />
              <div className="jCardBody">
                <div className="jSymbol">BTC</div>
              </div>
            </div>
            <div className="jCard">
              <div className="jCover" />
              <div className="jCardBody">
                <div className="jSymbol">BTC</div>
              </div>
            </div>
            <div className="jCard">
              <div className="jCover" />
              <div className="jCardBody">
                <div className="jSymbol">BTC</div>
              </div>
            </div>
            <button className="jCard jCardAdd" type="button">
              <div className="jAddTop">
                <span className="jAddPlus">＋</span>
                <span className="jAddText">新增第一張紀錄卡</span>
              </div>
            </button>
          </div>

          <div className="jHistory">
            <div className="jSectionTitle">歷史</div>
            <div className="jSectionHint">( 之後放列表/表格/篩選 )</div>
            <div className="jHistoryBox" />
          </div>
        </div>

        <aside className="jRightCol">
          <div className="jRightRow">
            <button className="jRemovePill" type="button">移除</button>
            <div className="jPerfCard">
              <div className="jPerfTitle">績效</div>
              <div className="jPerfRow"><span>今日筆數</span><b>0</b></div>
              <div className="jPerfRow"><span>總筆數</span><b>3</b></div>
              <div className="jPerfHint">（ 先占位：之後換 PnL / 勝率 / R 值 ）</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
