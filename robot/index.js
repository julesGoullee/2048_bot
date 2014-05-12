/*global $ */

var robots = {
	speed : 100,
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
	var tabPossibilite=[0,1,3]; //2 vers le bas

	self.initPanelDebug = function(){
		$("#panelRobot").append("<div id='debugue'><span>debug:</span><button id='clearDebug'>Clear</button>"+
			"<div id='debugueList'></div>"+
			"</div>");
		$("#clearDebug").click(function(){
			$("#debugueList").empty();
		});
	};
	var lastChoose = null;
	var afficheDebugue = function(mess){
		$("#debugueList").append("<div>"+mess+"<div");
	};

	var chooseSens = function(grid){

		var lineEmpty = function(iLigne){
			var returnValue = true;
			$.each(grid,function(iColonne, colonne){
				if(colonne[iLigne]){
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

		var titleLibreCoteGauche = function(iLigne){
			var returnValue = false;
			var titleNull = false;
			$.each(grid,function(iColonne, colonne){
				if (colonne[iLigne]) {
					if (titleNull) {// si je trouve un block alors que j'ai deja trouver un vide
						returnValue = true;
						return false;
					}
				}
				else {
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

		var titleNearFusion = function(iLigne){
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

		var titleDownFusion = function(iLigne){
			var returnValue = false;
			$.each(grid,function(iColonne,colonne){
				if(colonne[iLigne] && colonne[iLigne+1]){

					if(colonne[iLigne].value === colonne[iLigne+1].value ){
						returnValue = true;
						return false;
					}
				}
			});
			return returnValue;
		};

		var traiteLigne = function(line){
			
			if(lineEmpty(line)){
				return tabPossibilite[0];
			}
			if(lineFull(line)){
				if(titleNearFusion(line)){
					return tabPossibilite[2];
				}
				if(titleLibreCoteGauche(line)){
					return tabPossibilite[2];
				}
				if(titleLibreEtBlockDansLaColonne(line)) {
					return tabPossibilite[0];
				}
				if(titleDownFusion(line)){
					return tabPossibilite[0];
				}
				return tileFusionPossible(line);
			}
			else{
				if(titleNearFusion(line)){
					return tabPossibilite[2];
				}
				if(titleLibreCoteGauche(line)){
					return tabPossibilite[2];
				}
				if(titleLibreEtBlockDansLaColonne(line)) {
					return tabPossibilite[0];
				}
				if(titleDownFusion(line)){
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

		var returnSens = false;
		$.each(grid[0], function(iLigne,ligne){
			var result = traiteLigne(iLigne);
			if(result !== false){
				returnSens = result;
				return false;
			}
		});
		if(returnSens === false) {
			if (lastChoose === tabPossibilite[1]) {
				returnSens = tabPossibilite[2];
			}
			else {
				returnSens = tabPossibilite[1];
			}//pas le choix
		}
		lastChoose = returnSens;
		return returnSens;
	};

	var listenGrid = function() {
		Event.listen("grid",function(grid){
			var key = chooseSens(grid);
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

