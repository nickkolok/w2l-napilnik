var fs = require("fs");
var cyrtable = require("./cyr.js").cyrtable; // TODO: таки вынести в модуль

function replaceCyrillic(str){
	//Сначала - то, что в скобках
	for(var letter in cyrtable){
		str = str
			.replace(new RegExp("{\\\\cyr"+letter+"}"              ,"g"),cyrtable[letter])
			.replace(new RegExp("{\\\\CYR"+letter.toUpperCase()+"}","g"),cyrtable[letter].toUpperCase())
		;
	}
	//Теперь без скобок
	for(var letter in cyrtable){
		str = str
			.replace(new RegExp( "\\\\cyr"+letter                  ,"g"),cyrtable[letter])
			.replace(new RegExp( "\\\\CYR"+letter.toUpperCase()    ,"g"),cyrtable[letter].toUpperCase())
		;
	}
	return str;
}

function removeSkips(text){
	text = text.replace(/\\bigskip/g,"");
	return text;
}


function makeShortTextRowsLonger(text){
	var rows = text.split('\n');
	var shortTextRow = /^([А-ЯЁа-яёa-zA-Z\d\s\-\.\,:;\?\!\(\)]|\[\d\]|\\-)+$/;
	for(var i=0; i<rows.length-1; i++){
		if(
			shortTextRow.test(rows[i])
		&&
			shortTextRow.test(rows[i+1])
		){
			rows[i] += " " + rows[i+1];
			rows.splice(i+1,1);
			i--;
		}
	}
	return rows.join('\n');
}


function findTextlatinArtifacts(text){
	console.log("Finding unknown symbols...");
	var rows = text.split('\n');
	var target = /\[[0-9A-F]+\?\]/;
	for(var i=0; i<rows.length-1; i++){
		var pos = rows[i].search(target);
		if(pos!=-1){
			console.log("row: "+(i+1)+" \t first pos: "+(pos+1));
		}
	}
	console.log("Done");
}

var textlatins = {
	"27E8" : "\\left<",
	"27E9" : "\\right>",
}


function replaceTextlatinArtifacts(str){
	for(var letter in textlatins){
		letter = "[" + letter + "?]";
		str = str
			.replace(new RegExp("\\\\textlatin\{"+letter+"\}","g"),textlatins[letter])
			.replace(new RegExp("\\\\text\{"+letter+"\}","g"),textlatins[letter])
			.replace(new RegExp("\{"+letter+"\}","g"),textlatins[letter])
			.replace(new RegExp(letter,"g"),textlatins[letter])
		;

	}

	return str;
}

function removeHypertargets(text){
	return text.replace(/\\hypertarget\{RefHeading[\d]+\}\{\}/g,"");
}


function normalizeCommands(text){
	//TODO: допилить
	return text.replace(/\\textmu/g,"\\mu");
}

function revealForeignLanguage(text){
	return text.replace(/\\foreignlanguage\{[a-z]+\}\{(([^}]|\\\})+)\}/g,"$1");
}

function removeTextcolor(text){
	return text.replace(/\\textcolor\{[a-z]+\}\{(([^}]|\\\})+)\}/g,"$1");
}

function revealDoubleCurlyBraces(text){
	return text.replace(/\{\{(([^}]|\\\})+)\}\}/g,"{$1}");
}

function removeEndlineSpaces(text){
	return text.replace(/[ ]+(?=\n)/g,"");
}

function deleteSectionsSquarebrackets(text){
	return text.replace(/\\(section|chapter|subsection|subsubsection|paragraph)\[(\{\]\}|[^\]])+\]/g,"\\$1");
}

function deleteSectionsHardcodedRubbish(text){
	return text.replace(/\\(section|chapter|subsection|subsubsection|paragraph)\s*\{(глава|[\d\.)\s])+/gi,"\\$1{");
}

function mergeSimilarCommands(text){
	var reg = /\\(textbf|textit)\{((?:[^}]|\\\})+)\}( *\n? *)\\\1\{((?:[^}]|\\\})+)\}/g
	//Объединяет только парами
	while(reg.test(text)){
		text = text.replace(reg,"\\$1{$2$3$4}");
	}
	return text;
	//TODO: Корректная обработка строк вида
	//\textbf{f \textsubscript{osc}}\textbf{ * 1000}
	//Вероятно, через скобочные системы/деревья
}


function processFile(filename, resultname){
	console.log("From: "+process.argv[2]);
	console.log("To  : "+process.argv[3]);
	var text = fs.readFileSync(filename,'utf-8');
	text = replaceCyrillic(text);
//	text = replaceTextlatinArtifacts(text);
	text = removeHypertargets(text);
	text = normalizeCommands(text);
	text = revealForeignLanguage(text);
	text = removeTextcolor(text);
	text = revealDoubleCurlyBraces(text);
	text = removeSkips(text);
	text = makeShortTextRowsLonger(text);
	text = removeEndlineSpaces(text);
	text = deleteSectionsSquarebrackets(text);
	text = deleteSectionsHardcodedRubbish(text);
	text = mergeSimilarCommands(text);
	findTextlatinArtifacts(text);
	fs.writeFileSync(resultname,text);
}


processFile(process.argv[2],process.argv[3]);
