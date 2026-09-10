(function(){
  'use strict';

  function javaBotCalls(){
    const src=program?.[0]?.source||'';
    const m=src.match(/\bbot\s*\.\s*(?:take|send|copyTo|copyFrom|place|pick|add|subtract)\s*\(/g);
    return m?m.length:0;
  }

  function showJavaWin(){
    const next=levelIndex<levels.length-1;
    const calls=javaBotCalls();
    const steps=(typeof javaMachine!=='undefined'&&javaMachine?.steps)||Number(els.steps?.textContent)||0;
    showModal(`<div class="win-sheet java-win-sheet">
      <div class="win-stamp">JAVA PASSED</div>
      <h2>Program.java completed the assignment</h2>
      <div class="big-stars">★★</div>
      <p>Your compiled Java program produced exactly the requested OUTPUT while controlling Byte through the restricted ByteBot API.</p>
      <div class="score-cards">
        <div><span>Source</span><b>${calls} ByteBot calls</b><em>Real Java 8</em><small>main() supplied by ByteOffice</small></div>
        <div><span>Runtime</span><b>${steps} actions</b><em>Physical machine execution</em><small>${level().memory} floor slot${level().memory===1?'':'s'} available</small></div>
      </div>
      <div class="win-actions"><button id="replayLevelBtn" class="paper-button">Run Again</button>${next?'<button id="nextLevelBtn" class="modal-primary">Next Assignment →</button>':'<button id="nextLevelBtn" class="modal-primary">View Levels</button>'}</div>
    </div>`);
    document.querySelector('#replayLevelBtn')?.addEventListener('click',()=>{closeModal();resetMachine();});
    document.querySelector('#nextLevelBtn')?.addEventListener('click',()=>{if(next)enterGame(levelIndex+1);else openRoadmap('game');});
  }

  const physicalSuccess=window.successFeedback;
  if(typeof physicalSuccess==='function'){
    window.successFeedback=async function(){
      await physicalSuccess();
      showJavaWin();
    };
  }

  window.showHelp=function(){
    showModal(`<div class="modal-heading"><span>JAVA HANDBOOK</span><h2>Programming Byte</h2></div><div class="help-copy">
      <p>You write a normal <b>Program.java</b>. ByteOffice owns <code>main()</code>, creates one <code>ByteBot</code>, and calls <code>program(ByteBot bot)</code>.</p>
      <p><b>Java is real:</b> use variables, fields, methods, helper classes, loops, conditions, arrays, collections, recursion and the Java standard library. The source is compiled and executed inside the browser with Java 8.</p>
      <p><b>The physical restriction is ByteBot:</b> <code>bot.take()</code>, <code>bot.send()</code>, <code>bot.copyTo(slot)</code>, <code>bot.copyFrom(slot)</code>, <code>bot.place(slot)</code>, <code>bot.pick(slot)</code>, <code>bot.add(slot)</code> and <code>bot.subtract(slot)</code> never return box values. There is no value getter or peek API.</p>
      <p>Use <code>bot.hasNext()</code>, <code>bot.isZero()</code>, <code>bot.isNegative()</code>, <code>bot.isHolding()</code>, <code>bot.memorySize()</code> and <code>bot.isEmpty(slot)</code> for safe control information.</p>
      <p><b>RUN / F9</b> continues Java execution. <b>STEP / F10</b> releases exactly one physical ByteBot action. <b>Pause</b> stops at the next ByteBot action boundary. Test ×2 compiles once and checks both examples.</p>
      <p>Each level still owns its physical floor-memory size. If a level has two slots, calls using slot 2 or higher fail even though your Java program itself remains unrestricted.</p>
    </div>`);
  };

})();
