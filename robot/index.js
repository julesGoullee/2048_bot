/*global $ */

var robots = {
	speed : 1000,
	inProgress : null,
//	autostart : function(){
//		Event.listen('autoStartGame', function () {
//			self.inProgress = true;
//		});
//		self.start();
//		self.listenIaPosition();
//		self.run();
//	},
	start : function() {
		var self = this;
		self.inProgress = true;

		Event.listen('stopGame',function(){
			self.stop();
		});
	},
	stop: function() {
		this.inProgress = false;
	},
	run : function() {
		var self = this;
		self.ia.initPanelDebug();

		setInterval(function () {

			if(self.inProgress) {
				self.ia.getKey();
			}
		}, self.speed);

	},
	listenIaPosition : function() {
		Event.listen('moveIa',function(key){
			Event.notify('moveTitle', key);
		});
	},
	showPanel : function() {
		var self = this;
		$('body').append('<div id="panelRobot"></div>');
		$("#panelRobot").append("<div id='startRobot'>Demarrer le mode flemme</div>"+
			"<div id='stopRobot'>Jouer comme un grand</div>");

		$("#startRobot").click(function(){
			if(!self.inProgress){
				self.start();
			}
		});
		$("#stopRobot").click(function(){
			if(self.inProgress){
				self.stop();
			}
		});
		self.listenIaPosition();
		self.run();

	},
	ia : new Ia()
};

robots.showPanel();

function Ia (){
	var self = this;
	var tabPossibilite = [0,1,3]; //2 vers le bas

	self.initPanelDebug = function() {
		$("#panelRobot").append("<div id='debugue'><span>debug:</span><button id='clearDebug'>Clear</button>"+
			"<div id='debugueList'></div>"+
			"</div>");
		$("#clearDebug").click(function(){
			$("#debugueList").empty();
		});
	};


	var afficheDebugue = function (mess) {
		$("#debugueList").prepend("<div>"+mess+"<div");
	};

	var chooseMove = function (grid) {

		var heapDirectionInLine = function (line) {
			if(estPaire(line)){
				return tabPossibilite[2];
			}
			return tabPossibilite[1];
		};

		var getLine = function (iLine) {
			var line = [];
			$.each(grid, function(iCol,col){
				line.push(col[iLine]);
			});
			return line;
		};

		var numbersNear = function (iLine) {
			var line = getLine(iLine);
			var meetNumber = false;
			var meetTileEmptyAfterNumber = false;
			var numbersNear = true;
			$.each(line,function(iTile,tile){
				if(meetNumber){
					if(tile === null){
						meetTileEmptyAfterNumber = true;
					}
				}
				if(tile){
					if(meetTileEmptyAfterNumber){
						numbersNear = false;
						return false;
					}
					meetNumber = true;
				}
			});
			return numbersNear;
		};

		var lineBeforeEmpty = function (iLine) {
			iLine = iLine > 0 ? iLine -1 : 0; // si premiere ligne la tester et pas ligne -1

			var returnValue = true;

			var line = getLine(iLine);

			$.each(line, function (iTile, tile) {
				if (tile) {
					returnValue = false;
					return false;
				}
			});

			return returnValue;
		};

		var lineFull = function (iLine) {
			var returnValue = true;
			var line = getLine(iLine);
			$.each(line,function (iTile, tile){
				if(!tile){
					returnValue = false;
					return false;
				}
			});
			return returnValue;
		};

		var tileEmptyForHeap = function (iLine) {
			var line = getLine(iLine);
			var tileHeapPosition = estPaire(iLine)? 0 : grid.length-1;
			return line[tileHeapPosition] === null || !numbersNear(iLine); // vide du coté de l'entassement ou case libre entre les nombres
		};

		var tileFusionInLine = function (iLine) {
			var returnValue = false;
			var line = getLine(iLine);
			$.each(line, function (iTile,tile) {
				if(tile && line[iTile+1] && tile.value === line[iTile+1].value){
					returnValue = true;
					return false;
				}
			});
			return returnValue;
		};

		var titleNumberSupThis = function(iLine){
			if(iLine > 0){
				var tileHeapPosition = estPaire(iLine)? 0 : grid.length-1;
				if(grid[tileHeapPosition][iLine-1]  && grid[tileHeapPosition][iLine]
					&& grid[tileHeapPosition][iLine-1].value < grid[tileHeapPosition][iLine].value){
					return true;
				}
			}
			return false;
		};

		var titleFusionNextLinesAlign = function(iLine){
			var returnValue = false;
			$.each(grid,function(iCol,col){
				if(col[iLine]){
					var nextTileMeet = false;
					$.each(col,function(iTile,tile){
						if(iTile > iLine) {
							if (!nextTileMeet){
								nextTileMeet = true;
								if (tile && tile.value === col[iLine].value) {
									returnValue = true;
									return false;
								}
							}
						}

					});
				}
			});
			return returnValue;
		};

		var tileEmptyAndNumberInCol = function(iLine){
			var returnValue = false;
			$.each(grid,function(iCol,col) {
				if (!col[iLine]) {
					$.each(col, function(iTile,tile){
						if(iTile > iLine && tile){
							returnValue = true;
						}
					});
				}
			});
			return returnValue;
		};

		///////
		var titleLibreRight = function(iLigne){
			var returnValue = false;
			var titleNull = false;
			$.each(grid, function(iColonne, colonne){
				if (colonne[iLigne]) {
					if (titleNull) {// si je trouve un block alors que j'ai deja trouver un vide
						returnValue = true;
						return false;
					}
				}
				else{
					titleNull = true;
				}
			});
			return returnValue;
		};



		var traiteLine = function(iLine){
			
			if(lineBeforeEmpty(iLine)){
				afficheDebugue("ligne vide");
				return tabPossibilite[0];
			}
			if(!lineFull(iLine) && tileEmptyForHeap(iLine)){ // entassement du bon coté si des cases de libre
				afficheDebugue("entassement du bon coté si des cases de libre");
				return heapDirectionInLine(iLine);
			}
			else{
				if(titleFusionNextLinesAlign(iLine)){ // fusion verticale
					afficheDebugue("fusion verticale");
					return tabPossibilite[0];
				}
				if(tileFusionInLine(iLine)){// fusion meme ligne
					afficheDebugue("fusion meme ligne");
					if(titleNumberSupThis(iLine)){
						afficheDebugue("-si la ligne du dessu le block est coincé");
						return heapDirectionInLine(iLine+1);// si la ligne du dessu le block est coincé
					}
					return heapDirectionInLine(iLine);
				}
				if(tileEmptyAndNumberInCol(iLine)){ // case libre et nombre dispo dans la colonne
					afficheDebugue("case libre et nombre dispo dans la colonne ");
					return tabPossibilite[0];
				}
				return false;
			}
		};

//		var tileFusionPossible = function(line){
//			var returnValue = false;
//			if(grid[0][line+1] && !lineFull(line+1) && lineFull(line)) {
//				$.each(grid, function (iColonne, colonne) {
//					if (grid[iColonne + 1] && grid[iColonne + 1][line + 1] && grid[iColonne + 1][line + 1].value === colonne[line].value) {
//						returnValue = tabPossibilite[2];
//						return false;
//					}
//					if (grid[iColonne - 1] && grid[iColonne - 1][line + 1] && grid[iColonne - 1][line + 1].value === colonne[line].value) {
//						returnValue = tabPossibilite[1];
//						return false;
//					}
//				});
//				if(returnValue){
//					return returnValue;
//				}
//			}
//
//			return false;
//		};

		var returnDirection = false;

		$.each(grid[0], function(iLigne){
			var result = traiteLine(iLigne);
			if(result !== false){
				returnDirection = result;
				return false;
			}
		});
		return returnDirection;
	};

	var listenGrid = function() {
		Event.listen("grid",function(grid){
			var key = chooseMove(grid);
			//repond a aucune condition
			if(key === false){
				afficheDebugue("aucune condition remplise");
				key = tabPossibilite[1];
			}
			Event.notify('moveIa',key);
		});
	};

	self.getKey = function(){
		Event.notify('getGrid',null);
	};

	listenGrid();
}

function estPaire (nombre) {
	return (nombre % 2) === 0;
}

