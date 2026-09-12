(function(){
  'use strict';

  function applyTheme(){
    const m=window.monaco;
    if(!m?.editor) return false;

    m.editor.defineTheme('byteoffice-workshop',{
      base:'vs-dark',
      inherit:true,
      rules:[
        {token:'keyword.java',foreground:'D48268',fontStyle:'bold'},
        {token:'string.java',foreground:'9DBB83'},
        {token:'number.java',foreground:'D6B66D'},
        {token:'comment.java',foreground:'7F8478',fontStyle:'italic'},
        {token:'type.identifier.java',foreground:'D8C99D'},
        {token:'identifier.java',foreground:'D7D1C1'},
        {token:'delimiter.java',foreground:'AAA28F'},
        {token:'annotation.java',foreground:'C69B60'}
      ],
      colors:{
        'editor.background':'#262723',
        'editor.foreground':'#D7D1C1',
        'editorLineNumber.foreground':'#696B61',
        'editorLineNumber.activeForeground':'#C8B98F',
        'editor.lineHighlightBackground':'#30322C',
        'editor.lineHighlightBorder':'#00000000',
        'editorCursor.foreground':'#D6B66D',
        'editor.selectionBackground':'#665A356F',
        'editor.inactiveSelectionBackground':'#51492F55',
        'editorIndentGuide.background1':'#373931',
        'editorIndentGuide.activeBackground1':'#6F6A56',
        'editorBracketMatch.background':'#5B68484F',
        'editorBracketMatch.border':'#8FA276',
        'editorGutter.background':'#262723',
        'editorWidget.background':'#353730',
        'editorWidget.border':'#655F50',
        'editorHoverWidget.background':'#353730',
        'editorHoverWidget.border':'#655F50',
        'input.background':'#22231F',
        'input.border':'#655F50',
        'input.foreground':'#E4D9BC',
        'list.hoverBackground':'#484A40',
        'list.activeSelectionBackground':'#665A35',
        'list.activeSelectionForeground':'#FFF1CF',
        'list.focusBackground':'#665A35',
        'list.focusForeground':'#FFF1CF',
        'editorSuggestWidget.background':'#353730',
        'editorSuggestWidget.border':'#655F50',
        'editorSuggestWidget.foreground':'#DED6C2',
        'editorSuggestWidget.selectedBackground':'#665A35',
        'editorSuggestWidget.highlightForeground':'#D48268',
        'scrollbarSlider.background':'#7C776344',
        'scrollbarSlider.hoverBackground':'#9A927366',
        'scrollbarSlider.activeBackground':'#B2A77D77',
        'minimap.background':'#22231F',
        'editorOverviewRuler.border':'#00000000',
        'focusBorder':'#BF9B4E88'
      }
    });

    m.editor.setTheme('byteoffice-workshop');
    return true;
  }

  if(applyTheme()) return;
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(applyTheme()||tries>240) clearInterval(timer);
  },25);
})();
