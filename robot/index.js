/*global $ */

var robots = {
	speed : 500,
	inProgress : null,
	autostart : function(){
		Event.listen('autoStartGame', function () {
			self.inProgress = true;
		});
		self.start();
		self.listenIaPosition();
		self.run();
	},
	start : function() {
		var self = this;
		self.inProgress = true;

		Event.listen('stopGame',function(){
			self.stop();
		});
	},
	stop: function(){
		this.inProgress = false;
	},
	run : function(){
		var self = this;
		self.ia.initPanelDebug();

		setInterval(function () {

			if(self.inProgress) {
				self.ia.getKey();
			}
		}, self.speed);

	},
	listenIaPosition : function(){
		Event.listen('moveIa',function(key){
			Event.notify('moveTitle', key);
		});
	},
	showPanel : function(){
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

	self.initPanelDebug = function(){
		$("#panelRobot").append("<div id='debugue'><span>debug:</span><button id='clearDebug'>Clear</button>"+
			"<div id='debugueList'></div>"+
			"</div>");
		$("#clearDebug").click(function(){
			$("#debugueList").empty();
		});
	};


	var afficheDebugue = function(mess){
		$("#debugueList").append("<div>"+mess+"<div");
	};

	var chooseMove = function(grid){


		var heapDirectionInLine = function(line){
			if(estPaire(line)){
				return tabPossibilite[2];
			}
			return tabPossibilite[1];
		};

		var lineBeforeEmpty = function(iLigne){
			if(iLigne < 0) {
				iLigne -=1 ; // si premiere ligne la tester et pas ligne -1
			}
			var returnValue = true;
			$.each(grid, function (iColonne, colonne) {
				if (colonne[iLigne]) {
					returnValue = false;
					return false;
				}
			});
			return returnValue;
		};

		var lineFull = function(iLigne){
			var returnValue = true;
			$.each(grid,function(iColonne, colonne){
				if(!colonne[iLigne]){
					returnValue = false;
					return false;
				}
			});
			return returnValue;
		};

		var titleLibreRight = function(iLigne){
			var returnValue = false;
			var titleNull = false;
			$.each(grid,function(iColonne, colonne){
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

		var titleLibreEtBlockDansLaColonne = function(iLigne){
			var returnValue = false;
			$.each(grid,function(iColonne,colonne){
				if(!colonne[iLigne]){
					$.each(colonne, function(iTitle,title) {
						if(title){
							returnValue = true;
							return false;
						}
					});
					if(returnValue){
						return false;
					}
				}
			});
			return returnValue;
		};

		var titleFusionInLine = function(iLigne){
			var returnValue = false;
			$.each(grid,function(iColonne,colonne){
				if(colonne[iLigne] && grid.hasOwnProperty(iColonne+1) && grid[iColonne+1][iLigne]){

					if(colonne[iLigne].value === grid[iColonne+1][iLigne].value ){
						returnValue = true;
						return false;
					}
				}
			});
			return returnValue;
		};

		var titleFusionNextLinesAlign = function(iLigne){
			var returnValue = false;
			$.each(grid,function(iCols,cols){
				if(cols[iLigne]){
					$.each(cols,function(iTile,tile){
						if(tile && tile.value === cols[iLigne].value){
							returnValue = true;
							return false;
						}
					});
				}
			});
			return returnValue;
		};

		var traiteLine = function(line){
			
			if(lineBeforeEmpty(line)){
				return tabPossibilite[0];
			}
			else{
				if(titleEmptyForHeap(line)){
					return heapDirectionInLine(line);
				}
				if(titleFusionNextLinesAlign(line)){
					return tabPossibilite[0];
				}
				if(titleFusionInLine(line)){
					return heapDirectionInLine(line);
				}
				if(titleLibreRight(line)){
					return tabPossibilite[2];
				}
				if(titleLibreEtBlockDansLaColonne(line)) {
					return tabPossibilite[0];
				}
				return tileFusionPossible(line);
			}
		};

		var tileFusionPossible = function(line){
			var returnValue = false;
			if(grid[0][line+1] && !lineFull(line+1) && lineFull(line)) {
				$.each(grid, function (iColonne, colonne) {
					if (grid[iColonne + 1] && grid[iColonne + 1][line + 1] && grid[iColonne + 1][line + 1].value === colonne[line].value) {
						returnValue = tabPossibilite[2];
						return false;
					}
					if (grid[iColonne - 1] && grid[iColonne - 1][line + 1] && grid[iColonne - 1][line + 1].value === colonne[line].value) {
						returnValue = tabPossibilite[1];
						return false;
					}
				});
				if(returnValue){
					return returnValue;
				}
			}

			return false;
		};

		var returnDirection = false;
		$.each(grid[0], function(iLigne,ligne){
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
				afficheDebugue(key);
			Event.notify('moveIa',key);
		});
	};

	self.getKey = function(){
		Event.notify('getGrid',null);
//		key = Math.floor((Math.random() * tabPossibilite.length-1) + 1);
	};

	listenGrid();
}

function estPaire (nombre) {
	return (nombre % 2) === 0;
}

