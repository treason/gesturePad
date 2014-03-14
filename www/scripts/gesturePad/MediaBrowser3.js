var mb3 = {
	config: {
		server: "192.168.1.146",
		port: "8096",
		userName: "treason",
		password: "urchin",
		userID: ""
	},
	getServiceUrl: function() {
		return "http://" + mb3.config.server + ":" + mb3.config.port;
	},
	getUserId: function() {
		return mb3.config.userID;
	},
	hashPassword: function(msg) {

		function rotate_left(n, s) {
			var t4 = (n << s) | (n >>> (32 - s));
			return t4;
		}

		function lsb_hex(val) {
			var str = "";
			var i;
			var vh;
			var vl;

			for (i = 0; i <= 6; i += 2) {
				vh = (val >>> (i * 4 + 4)) & 0x0f;
				vl = (val >>> (i * 4)) & 0x0f;
				str += vh.toString(16) + vl.toString(16);
			}
			return str;
		}

		function cvt_hex(val) {
			var str = "";
			var i;
			var v;

			for (i = 7; i >= 0; i--) {
				v = (val >>> (i * 4)) & 0x0f;
				str += v.toString(16);
			}
			return str;
		}

		function Utf8Encode(string) {
			string = string.replace(/\r\n/g, "\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {

				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				} else if ((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				} else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}

			}

			return utftext;
		}

		var blockstart;
		var i, j;
		var W = new Array(80);
		var H0 = 0x67452301;
		var H1 = 0xEFCDAB89;
		var H2 = 0x98BADCFE;
		var H3 = 0x10325476;
		var H4 = 0xC3D2E1F0;
		var A, B, C, D, E;
		var temp;

		msg = Utf8Encode(msg);

		var msg_len = msg.length;

		var word_array = [];
		for (i = 0; i < msg_len - 3; i += 4) {
			j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 |
				msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
			word_array.push(j);
		}

		switch (msg_len % 4) {
			case 0:
				i = 0x080000000;
				break;
			case 1:
				i = msg.charCodeAt(msg_len - 1) << 24 | 0x0800000;
				break;

			case 2:
				i = msg.charCodeAt(msg_len - 2) << 24 | msg.charCodeAt(msg_len - 1) << 16 | 0x08000;
				break;

			case 3:
				i = msg.charCodeAt(msg_len - 3) << 24 | msg.charCodeAt(msg_len - 2) << 16 | msg.charCodeAt(msg_len - 1) << 8 | 0x80;
				break;
		}

		word_array.push(i);

		while ((word_array.length % 16) != 14) word_array.push(0);

		word_array.push(msg_len >>> 29);
		word_array.push((msg_len << 3) & 0x0ffffffff);

		for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {

			for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i];
			for (i = 16; i <= 79; i++) W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

			A = H0;
			B = H1;
			C = H2;
			D = H3;
			E = H4;

			for (i = 0; i <= 19; i++) {
				temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B, 30);
				B = A;
				A = temp;
			}

			for (i = 20; i <= 39; i++) {
				temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B, 30);
				B = A;
				A = temp;
			}

			for (i = 40; i <= 59; i++) {
				temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B, 30);
				B = A;
				A = temp;
			}

			for (i = 60; i <= 79; i++) {
				temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B, 30);
				B = A;
				A = temp;
			}

			H0 = (H0 + A) & 0x0ffffffff;
			H1 = (H1 + B) & 0x0ffffffff;
			H2 = (H2 + C) & 0x0ffffffff;
			H3 = (H3 + D) & 0x0ffffffff;
			H4 = (H4 + E) & 0x0ffffffff;

		}

		var out = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

		return out.toLowerCase();
	},
	authenticateUser: function(user, pass) {
		var url = mb3.getServiceUrl() + "/mediabrowser/Users/AuthenticateByName?format=json";
		$.ajax({
			url: url,
			data: "Username=" + user + "&Password=" + mb3.hashPassword(pass),
			type: "POST",
			success: function(json) {
				mb3.config.userID = json.User.Id;
			},
			error: function(x, y, z) {
				console.log("Auth Error");
				console.log(x);
				console.log(y);
				console.log(z);
			}
		});
	},
	lastOpenedCallBack: function() {
		mb3.createInitialListView();
	},
	backButtonCallback: function() {
		mb3.createInitialListView();
	},
	resetCallback: function() {
		MediaBrowser.lastOpenedCallBack = function() {
			MediaBrowser.createInitialListView();
		};
	},
	playByID: function(buttonIndex, id) {
		if (buttonIndex == 2) {
			DoShuffle();
		}
		if (buttonIndex == 1) {
			var MBUrl = util.getMBUrl();
			MBUrl += "ui?command=play&id=" + id;
			$.getJSON(MBUrl, function(x) {
				setTimeout(function() {
					ui.queryNowPlaying();
				}, 1500);
			});
		}
	},
	playTitle: function(tr, movieTitle, playNow) {
		if (util.isWifi() === false) {
			util.doAlert("You are not on Wifi. To play this title, connect to Wifi and try again");
			return;
		}
		var MBUrl = util.getMBUrl();
		var guid = "";
		if (playNow) {
			guid = $(tr).attr("data-guid");
			MBUrl += "ui?command=play&id=" + guid;
			$.getJSON(MBUrl, function() {
				setTimeout(function() {
					ui.queryNowPlaying();
				}, 1500);
			});
			util.doAlert("Now Playing\n" + movieTitle);
		} else {
			var actionSheet = window.plugins.actionSheet;
			var actions = ["Play", "Resume", "View on Screen"];
			if ($(tr).attr("data-imdb") == "1") {
				actions.push("View Imdb Page");
			}
			actions.push("Cancel");
			guid = $(tr).attr("data-guid");
			var title = "Actions";
			if (title !== undefined) {
				title = movieTitle;
			}
			actionSheet.create({
				title: title,
				items: actions,
				destructiveButtonIndex: (actions.length - 1)
			}, function(buttonValue, buttonIndex) {
				if (buttonIndex == -1 || buttonIndex == (actions.length - 1)) {
					return;
				}
				switch (actions[buttonIndex]) {
					case "Play":
						MBUrl += "ui?command=play&id=" + guid;
						break;
					case "Resume":
						MBUrl += "ui?command=resume&id=" + guid;
						break;
					case "View on Screen":
						MBUrl += "ui?command=navigatetoitem&id=" + guid;
						break;
					case "View Imdb Page":
						MBUrl = "";
						break;
				}
				if (MBUrl !== "") {
					$.getJSON(MBUrl, function() {
						setTimeout(function() {
							ui.queryNowPlaying();
						}, 1500);
					});
				} else {
					//launch Imdb
					$.ajax({
						url: util.getMBUrl() + "library/?Id=" + guid + "&lightData=1",
						dataType: 'json',
						timeout: settings.userSettings.MBServiceTimeout,
						success: function(x) {
							if (x.Data.ImdbID) {
								var nt = window.plugins.NativeTable;
								nt.hideTable(function() {
									cb = window.plugins.childBrowser;
									if (cb !== null) {
										cb.onClose = function() {
											setTimeout(function() {
												ui.view.trigger("rightNavButtonTap");
											}, 1000);
										};
										cb.showWebPage("http://m.imdb.com/title/" + x.Data.ImdbID);
									}
								});
							} else {
								util.doAlert("Sorry, This title does not have an IMBD id");
							}
						},
						error: function() {
							if (parse) {
								util.doAlert("The server is not responding in time, and no cached version exists. Try again later");
							}
						}
					});
				}
			});
		}
	},
	ShowItems: function(item, sentEventType) {
		var eventType = "click";
		if (sentEventType) {
			eventType = sentEventType;
		}

		var MBUrl = mb3.getServiceUrl();

		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var parseJsonResults = function(x) {

			if (x.back == "StartupFolder") {
				MediaBrowser.createInitialListView();
				return;
			}

			var tableView = [];
			$.each(x.Items, function(key, item) {
				if (item.Type == "Folder" || item.Type == "Season" || item.Type == "Series" || item.Type == "FavoriteFolder") {
					tableView.push({
						'textLabel': item.Name,
						'detailTextLabel': "" + item.RecursiveItemCount + " total, " + item.RecursiveUnplayedItemCount + " not watched, " + item.RecentlyAddedItemCount + " new",
						'icon': "greyarrow",
						'sectionHeader': item.Type,
						'image': mb3.getServiceUrl() + "/mediabrowser/Items/" + item.Id + "/Images/Primary?maxheight=120&maxwidth=120",
						'guid': item.Id,
						'type': item.Type,
						'imdb': "0"
					});
				} else {
					tableView.push({
						'textLabel': (item.UserData.PlayCount === 0 ? " " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
						'detailTextLabel': (item.CommunityRating ? item.CommunityRating + "/10 " : "") + (item.Overview ? item.Overview : ""),
						'icon': "none",
						'sectionHeader': item.Type,
						'image': mb3.getServiceUrl() + "/mediabrowser/Items/" + item.Id + "/Images/Primary?maxheight=120&maxwidth=120",
						'guid': item.Id,
						'type': item.Type,
						'imdb': item.ProviderIds.Imdb ? "1" : "0"
					});
				}
			});
			var nt = window.plugins.NativeTable;
			nt.createTable({
				'height': $(window).height(),
				'showSearchBar': true,
				'showNavBar': true,
				'navTitle': x.Title,
				'navBarColor': 'black',
				'showRightButton': true,
				'RightButtonText': 'Close',
				'showBackButton': true,
				'showToolBar': true,
				'MediaBrowserToolBar': true
			});

			nt.onToolbarButtonClick(function(buttonIndex) {
				MediaBrowser.toolbarButtonClickEvent(buttonIndex, nt);
			});

			nt.onRightButtonTap(function() {
				nt.hideTable(function() {});
			});
			nt.setRowSelectCallBackFunction(function(rowId) {
				var item = tableView[rowId];
				if (item.icon == "none") {
					var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
					MediaBrowser.playTitle($(tr), item.textLabel, false);
				} else {
					nt.hideTable(function() {
						/*
						mb3.backButtonCallback = function() {
							mb3.lastOpenedCallBack();
						};
						*/
						mb3.ShowItems(item);
					});
				}
			});

			nt.onBackButtonTap(function() {
				nt.hideTable(function() {
					mb3.backButtonCallback();
				});
			});

			nt.setTableData(tableView);
			util.doHud({
				show: false
			});
			nt.showTable(function() {});
		};
		var getJsonFromServer = function(MBUrl, parse, Title) {
			if (util.isWifi() === false && parse) {
				util.doAlert("Sorry, you are not on Wifi, and this data is yet to be cached.");
				return;
			}
			$.ajax({
				url: MBUrl,
				dataType: 'json',
				timeout: settings.userSettings.MBServiceTimeout,
				success: function(d) {
					if (d !== null) {
						d.Title = Title;
						cache.saveJson(MBUrl, d);
					}
					if (parse) {
						parseJsonResults(d);
					}
				},
				error: function() {
					if (parse) {
						util.doAlert("The server is not responding in time, and no cached version exists. Try again later");
					}
				}
			});
		};

		if (item.type == "CustomFolder") {
			switch (item.folderType) {
				case "Genres":
					MediaBrowser.lastOpenedCallBack = function() {
						MediaBrowser.showListOfGenres();
					};
					break;
				case "Years":
					MediaBrowser.lastOpenedCallBack = function() {
						MediaBrowser.showListOfYears();
					};
					break;
				case "Actors":
					MediaBrowser.lastOpenedCallBack = function() {
						MediaBrowser.showListOfActors();
					};
					break;
				case "Directors":
					MediaBrowser.lastOpenedCallBack = function() {
						MediaBrowser.showListOfDirectors();
					};
					break;
				case "OfficialRating":
					MediaBrowser.lastOpenedCallBack = function() {
						MediaBrowser.showListOfRating();
					};
					break;
				case "IMDBRating":
					MediaBrowser.lastOpenedCallBack = function() {
						MediaBrowser.showListOfIMDBRating();
					};
					break;
				case "Unwatched":
					MediaBrowser.lastOpenedCallBack = function() {
						MediaBrowser.showListOfUnwatched();
					};
					break;
				case "Custom TV":
					MediaBrowser.lastOpenedCallBack = function() {
						MediaBrowserNowPlaying.buildListView();
					};
					break;
			}
			MediaBrowser.lastOpenedCallBack();
		} else {


			

			mb3.lastOpenedCallBack = function() {
				var URL = mb3.getServiceUrl() + "/mediabrowser/Users/" + mb3.getUserId() + "/Items?format=json&Fields=Overview,ProviderIds&ParentId=" + item.guid;
				if (settings.userSettings.moviesByDate) {
					URL += "&SortBy=DateCreated&SortOrder=Descending";
				}
				cache.getJson(URL, function(d) {
					if (d === null) {
						//get from server
						getJsonFromServer(URL, true, item.Name);
					} else {
						//display cached
						parseJsonResults(d);
						//get from server, to replace cache but dont parse
						getJsonFromServer(URL, false, item.Name);
					}
				});
			};
			mb3.backButtonCallback = jQuery.extend(true, {}, mb3.lastOpenedCallBack);
			mb3.lastOpenedCallBack();

		}
	},
	createInitialListView: function() {

		var parseJsonResults = function(d) {

			//parse the StartUp Folder
			var tableView = [];
			$.each(d.Items, function(key, item) {
				tableView.push({
					'textLabel': item.Name,
					'detailTextLabel': "" + item.RecursiveItemCount + " total, " + item.RecursiveUnplayedItemCount + " not watched, " + item.RecentlyAddedItemCount + " new",
					'icon': "greyarrow",
					'sectionHeader': "Folders",
					'image': mb3.getServiceUrl() + "/mediabrowser/Items/" + item.Id + "/Images/Primary?maxheight=120&maxwidth=120",
					'nomask': false,
					'guid': item.Id,
					'type': item.Type
				});
			});

			tableView.unshift({
				'textLabel': 'Custom TV',
				'detailTextLabel': "TV Channels based off your library",
				'icon': "greyarrow",
				'sectionHeader': "Now Playing",
				'image': "www/img/mb.png",
				'nomask': false,
				'type': 'CustomFolder',
				'folderType': 'Custom TV'
			});

			tableView.push({
				'textLabel': 'Genres',
				'detailTextLabel': "Movies Separated By Genre",
				'icon': "greyarrow",
				'sectionHeader': "Categories",
				'image': "www/img/mb.png",
				'nomask': false,
				'type': 'CustomFolder',
				'folderType': 'Genres'
			});
			tableView.push({
				'textLabel': 'Rating',
				'detailTextLabel': "Movies sorted by IMDB Rating",
				'icon': "greyarrow",
				'sectionHeader': "Categories",
				'image': "www/img/mb.png",
				'nomask': false,
				'type': 'CustomFolder',
				'folderType': 'IMDBRating'
			});
			tableView.push({
				'textLabel': 'Release Year',
				'detailTextLabel': "Movies Separated By Production Year",
				'icon': "greyarrow",
				'sectionHeader': "Categories",
				'image': "www/img/mb.png",
				'nomask': false,
				'type': 'CustomFolder',
				'folderType': 'Years'
			});
			tableView.push({
				'textLabel': 'Unwatched',
				'detailTextLabel': "Movies that have not been watched",
				'icon': "greyarrow",
				'sectionHeader': "Categories",
				'image': "www/img/mb.png",
				'nomask': false,
				'type': 'CustomFolder',
				'folderType': 'Unwatched'
			});
			tableView.push({
				'textLabel': 'Actors',
				'detailTextLabel': "Movie Actors",
				'icon': "greyarrow",
				'sectionHeader': "Categories",
				'image': "www/img/mb.png",
				'nomask': false,
				'type': 'CustomFolder',
				'folderType': 'Actors'
			});
			tableView.push({
				'textLabel': 'Directors',
				'detailTextLabel': "Movie Directors",
				'icon': "greyarrow",
				'sectionHeader': "Categories",
				'image': "www/img/mb.png",
				'nomask': false,
				'type': 'CustomFolder',
				'folderType': 'Directors'
			});
			tableView.push({
				'textLabel': 'MPAA Rating',
				'detailTextLabel': "Official rating by the MPAA",
				'icon': "greyarrow",
				'sectionHeader': "Categories",
				'image': "www/img/mb.png",
				'nomask': false,
				'type': 'CustomFolder',
				'folderType': 'OfficialRating'
			});

			var nt = window.plugins.NativeTable;
			nt.createTable({
				'height': $(window).height(),
				'showSearchBar': true,
				'showNavBar': true,
				'navTitle': "Movies",
				'navBarColor': 'black',
				'showRightButton': true,
				'RightButtonText': 'Close',
				'showBackButton': false,
				'showToolBar': true,
				'MediaBrowserToolBar': true
			});

			nt.onToolbarButtonClick(function(buttonIndex) {
				MediaBrowser.toolbarButtonClickEvent(buttonIndex, nt);
			});

			nt.onRightButtonTap(function() {
				nt.hideTable(function() {});
			});
			nt.setRowSelectCallBackFunction(function(rowId) {
				var item = tableView[rowId];
				nt.hideTable(function() {
					util.doHud({
						show: true,
						labelText: "Loading Data...",
						detailsLabelText: "Please Wait..."
					});
					mb3.backButtonCallback = function() {
						mb3.createInitialListView();
					};
					setTimeout(function() {
						mb3.ShowItems(item);
					}, 250);
				});
			});
			nt.setTableData(tableView);
			util.doHud({
				show: false
			});
			nt.showTable(function() {});
		};

		var getJsonFromServer = function(MBUrl, parse) {
			if (util.isWifi() === false) {
				if (parse) {
					util.doAlert("You are not on Wifi and no cached version exists. To do this, connect to Wifi and try again");
					mb3.createInitialListView();
					return;
				}
			}
			$.ajax({
				url: MBUrl,
				dataType: 'json',
				timeout: settings.MBServiceTimeout,
				success: function(d) {
					cache.saveJson(MBUrl, d);
					if (parse) {
						parseJsonResults(d);
					}
				},
				error: function() {
					if (parse) {
						util.doAlert("The server is not responding in time, and no cached version exists. Try again later");
					}
				}
			});
		};
		var MBUrl = mb3.getServiceUrl() + "/mediabrowser/Users/" + mb3.getUserId() + "/Items?format=json";

		mb3.lastOpenedCallBack = function() {
			mb3.createInitialListView();
		};
		cache.getJson(MBUrl, function(d) {
			if (d === null) {
				getJsonFromServer(MBUrl, true);
			} else {
				parseJsonResults(d); //display cached
				getJsonFromServer(MBUrl, false); //get from server, to replace cache but dont parse
			}
		});
	},
	loadGeniusResults: function(callback) {
		cache.getJson("genius", function(geniusResults) {
			if (geniusResults === null) {
				geniusResults = {
					refreshQueue: [],
					Titles: {},
					TitlesQueue: {},
					allItems: [],
					loaded: false
				};
			}
			callback(geniusResults);
		});
	},
	toolbarButtonClickEvent: function(buttonIndex, nt) {

		if (buttonIndex == 1) { //Recent Channels
			MediaBrowserNowPlaying.allItemsPopulated = false;
			nt.hideTable(function() {
				ui.view.trigger("rightNavButtonTap");
			});
		}
		if (buttonIndex == 2) { //Volume Down
			gestures.executeGestureByCommandName("VolumeDown");
		}
		if (buttonIndex == 3) { //Volume Up
			gestures.executeGestureByCommandName("VolumeUp");
		}
		if (buttonIndex == 4) { //Peek rooms
			nt.hideTable(function() {
				util.setDeviceByShortName("DTV");
				ui.view.trigger("rightNavButtonTap");
			});
		}
		if (buttonIndex == 5) { //Refresh
			nt.hideTable(function() {
				ui.view.trigger("rightNavButtonTap");
			});
		}

	},
	createCustomTable: function(tableView, tableTitle, backButtonCallback, itemSelectCallback) {
		var nt = window.plugins.NativeTable;
		nt.createTable({
			'height': $(window).height(),
			'showSearchBar': true,
			'showNavBar': true,
			'navTitle': tableTitle,
			'navBarColor': 'black',
			'showRightButton': true,
			'RightButtonText': 'Close',
			'showBackButton': true,
			'showToolBar': true,
			'MediaBrowserToolBar': true
		});

		nt.onToolbarButtonClick(function(buttonIndex) {
			MediaBrowser.toolbarButtonClickEvent(buttonIndex, nt);
		});

		nt.onRightButtonTap(function() {
			nt.hideTable(function() {});
		});
		nt.setRowSelectCallBackFunction(function(rowId) {
			itemSelectCallback(rowId, nt);
		});

		nt.onBackButtonTap(function() {
			nt.hideTable(function() {
				backButtonCallback();
			});
		});

		nt.setTableData(tableView);
		util.doHud({
			show: false
		});
		nt.showTable(function() {});
	},
	showListOfYears: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var ProductionYears = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.ProductionYear !== "" && item.ProductionYear !== null) {
					if (jQuery.inArray(item.ProductionYear, ProductionYears) == -1) {
						ProductionYears.push(item.ProductionYear);
						tableView.push({
							'textLabel': item.ProductionYear.toString(),
							'detailTextLabel': "Movies Released in " + item.ProductionYear,
							'icon': "greyarrow",
							'sectionHeader': "Movies By Year",
							'type': 'CustomFolder',
							'folderType': 'Years'
						});
					}
				}
			});

			ProductionYears = null;
			if (tableView.length === 0) {
				util.doAlert("No Years found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
				return;
			}
			tableView.sort(util.dynamicSort("-textLabel"));
			MediaBrowser.createCustomTable(tableView, "Years", function() {
				MediaBrowser.createInitialListView();
			}, function(x, nt) {
				var item = tableView[x];
				nt.hideTable(function() {
					MediaBrowser.showListOfMoviesByYear(item.textLabel);
				});
				MediaBrowser.lastOpenedCallBack = function() {
					MediaBrowser.showListOfMoviesByYear(item.textLabel);
				};
			});
		});
	},
	showListOfMoviesByYear: function(year) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});

		var tableView = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.ProductionYear == year) {
					tableView.push({
						'textLabel': (item.WatchedPercentage === 0 ? " " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
						'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
						'icon': "none",
						'image': util.getRandomMBServer() + "image/?Id=" + item.Id + "&maxwidth=120&maxheight=120",
						'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
						'guid': item.Id,
						'type': item.Type,
						'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
						'sortName': item.SortName
					});
				}
			});

			if (tableView.length === 0) {
				util.doAlert("No movies found for this year.");
				return;
			}
			tableView.sort(util.dynamicSort("sortName"));

			MediaBrowser.createCustomTable(tableView, year, function() {
				MediaBrowser.showListOfYears();
			}, function(x, nt) {
				var item = tableView[x];
				var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
				MediaBrowser.playTitle($(tr), item.textLabel, false);
			});
		});
	},
	showListOfGenres: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var Genres = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.Genres) {
					for (var i = 0; i < item.Genres.length; i++) {
						if (item.Genres[i] !== "" && item.Genres[i] !== null) {
							if (jQuery.inArray(item.Genres[i], Genres) == -1) {
								Genres.push(item.Genres[i]);
								tableView.push({
									'textLabel': item.Genres[i],
									'detailTextLabel': "" + item.Genres[i] + " movies",
									'icon': "greyarrow",
									'sectionHeader': "Movies By Genre",
									'type': 'CustomFolder',
									'folderType': 'Genres'
								});
							}
						}
					}
				}
			});
			Genres = null;
			if (tableView.length === 0) {
				util.doAlert("No Genres found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
				return;
			}
			tableView.sort(util.dynamicSort("textLabel"));
			MediaBrowser.createCustomTable(tableView, "Genres", function() {
				MediaBrowser.createInitialListView();
			}, function(x, nt) {
				var item = tableView[x];
				nt.hideTable(function() {
					MediaBrowser.showListOfMoviesByGenre(item.textLabel);
				});
				MediaBrowser.lastOpenedCallBack = function() {
					MediaBrowser.showListOfMoviesByGenre(item.textLabel);
				};
			});

		});
	},
	showListOfMoviesByGenre: function(genre) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];

		MediaBrowser.loadGeniusResults(function(geniusResults) {

			$.each(geniusResults.Titles, function(idx, item) {
				if (item.Genres) {
					for (var i = 0; i < item.Genres.length; i++) {
						if (item.Genres[i] == genre) {
							tableView.push({
								'textLabel': (item.WatchedPercentage === 0 ? " " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
								'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
								'image': util.getRandomMBServer() + "image/?Id=" + item.Id + "&maxwidth=120&maxheight=120",
								'icon': "none",
								'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
								'guid': item.Id,
								'type': item.Type,
								'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
								'sortName': item.SortName
							});
						}
					}
				}
			});
			if (tableView.length === 0) {
				util.doAlert("No movies found for this genre.");
				return;
			}
			tableView.sort(util.dynamicSort("sortName"));

			MediaBrowser.createCustomTable(tableView, genre, function() {
				MediaBrowser.showListOfGenres();
			}, function(x, nt) {
				var item = tableView[x];
				var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
				MediaBrowser.playTitle($(tr), item.textLabel, false);
			});

		});
	},
	showListOfActors: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var Actors = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.Actors) {
					for (var i = 0; i < item.Actors.length; i++) {
						if ($.trim(item.Actors[i].Name) !== "" && item.Actors[i].Name !== null) {
							if (jQuery.inArray(item.Actors[i].Name, Actors) == -1) {
								Actors.push(item.Actors[i].Name);
								var LastThenFirstName = item.Actors[i].Name.split(" ").pop().replace(/[^a-zA-Z 0-9]+/g, '');
								LastThenFirstName += ", " + item.Actors[i].Name.split(" ")[0].replace(/[^a-zA-Z 0-9]+/g, '');
								if (LastThenFirstName.length > 4) {
									var a = {
										'textLabel': LastThenFirstName,
										'detailTextLabel': "",
										'icon': "greyarrow",
										'image': util.getRandomMBServer() + "image/?Id=" + item.Actors[i].Person.Id + "&maxwidth=120&maxheight=120",
										'sectionHeader': LastThenFirstName.substring(0, 1).toUpperCase(),
										'type': 'CustomFolder',
										'folderType': 'Actors',
										'customSort': LastThenFirstName,
										'ActualName': item.Actors[i].Name
									};
									if (item.Actors[i].Person) {
										if (item.Actors[i].Person.PrimaryImagePath !== "" && item.Actors[i].Person.PrimaryImagePath !== null) {
											a.image = util.getRandomMBServer() + "image/?Path=" + encodeURIComponent(item.Actors[i].Person.PrimaryImagePath) + "&maxwidth=120&maxheight=120";
											a.guid = item.Actors[i].Person.Id;
										}
									}
									tableView.push(a);
								}
							}
						}
					}
				}
			});
			Actors = null;
			if (tableView.length === 0) {
				util.doAlert("No Actors found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
				return;
			}
			tableView.sort(util.dynamicSort("customSort"));
			MediaBrowser.createCustomTable(tableView, "Actors", function() {
				MediaBrowser.createInitialListView();
			}, function(x, nt) {
				var item = tableView[x];
				nt.hideTable(function() {
					MediaBrowser.showListOfMoviesByActor(item.ActualName);
				});
				MediaBrowser.lastOpenedCallBack = function() {
					MediaBrowser.showListOfMoviesByActor(item.ActualName);
				};
			});
		});
	},
	showListOfMoviesByActor: function(actor) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});

		var tableView = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.Actors) {
					for (var i = 0; i < item.Actors.length; i++) {
						if (item.Actors[i].Name == actor) {
							tableView.push({
								'textLabel': (item.WatchedPercentage === 0 ? " " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
								'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
								'icon': "none",
								'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
								'image': util.getRandomMBServer() + "image/?Id=" + item.Id + "&maxwidth=120&maxheight=120",
								'guid': item.Id,
								'type': item.Type,
								'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
								'sortName': item.SortName
							});
						}
					}
				}
			});
			if (tableView.length === 0) {
				util.doAlert("No movies found for this actor.");
				return;
			}
			tableView.sort(util.dynamicSort("sortName"));

			MediaBrowser.createCustomTable(tableView, actor, function() {
				MediaBrowser.showListOfActors();
			}, function(x, nt) {
				var item = tableView[x];
				var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
				MediaBrowser.playTitle($(tr), item.textLabel, false);
			});

		});
	},
	showListOfDirectors: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var Directors = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.Directors) {
					for (var i = 0; i < item.Directors.length; i++) {
						if ($.trim(item.Directors[i]) !== "" && item.Directors[i] !== null) {
							if (jQuery.inArray(item.Directors[i], Directors) == -1) {
								Directors.push(item.Directors[i]);
								var LastThenFirstName = item.Directors[i].split(" ").pop().replace(/[^a-zA-Z 0-9]+/g, '');
								LastThenFirstName += ", " + item.Directors[i].split(" ")[0].replace(/[^a-zA-Z 0-9]+/g, '');
								if (LastThenFirstName.length > 4) {
									tableView.push({
										'textLabel': LastThenFirstName,
										'detailTextLabel': "",
										'icon': "greyarrow",
										'sectionHeader': LastThenFirstName.substring(0, 1).toUpperCase(),
										'type': 'CustomFolder',
										'folderType': 'Directors',
										'customSort': LastThenFirstName,
										'ActualName': item.Directors[i]
									});
								}
							}
						}
					}
				}
			});
			Directors = null;
			if (tableView.length === 0) {
				util.doAlert("No Directors found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
				return;
			}
			tableView.sort(util.dynamicSort("customSort"));
			MediaBrowser.createCustomTable(tableView, "Directors", function() {
				MediaBrowser.createInitialListView();
			}, function(x, nt) {
				var item = tableView[x];
				nt.hideTable(function() {
					MediaBrowser.showListOfMoviesByDirector(item.ActualName);
				});
				MediaBrowser.lastOpenedCallBack = function() {
					MediaBrowser.showListOfMoviesByDirector(item.ActualName);
				};
			});
		});
	},
	showListOfMoviesByDirector: function(Director) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.Directors) {
					for (var i = 0; i < item.Directors.length; i++) {
						if (item.Directors[i] == Director) {
							tableView.push({
								'textLabel': (item.WatchedPercentage === 0 ? " " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
								'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
								'icon': "none",
								'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
								'image': util.getRandomMBServer() + "image/?Id=" + item.Id + "&maxwidth=120&maxheight=120",
								'guid': item.Id,
								'type': item.Type,
								'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
								'sortName': item.SortName
							});
						}
					}
				}
			});
			if (tableView.length === 0) {
				util.doAlert("No movies found for this Director.");
				return;
			}
			tableView.sort(util.dynamicSort("sortName"));

			MediaBrowser.createCustomTable(tableView, Director, function() {
				MediaBrowser.showListOfDirectors();
			}, function(x, nt) {
				var item = tableView[x];
				var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
				MediaBrowser.playTitle($(tr), item.textLabel, false);
			});
		});
	},
	showListOfRating: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});

		var tableView = [];
		var OfficialRatings = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.OfficialRating !== "" && item.OfficialRating !== null) {
					if (jQuery.inArray(item.OfficialRating, OfficialRatings) == -1) {
						OfficialRatings.push(item.OfficialRating);
						tableView.push({
							'textLabel': item.OfficialRating.toString(),
							'detailTextLabel': "Movies Rated: " + item.OfficialRating,
							'icon': "greyarrow",
							'sectionHeader': "Movies By MPAA Rating",
							'type': 'CustomFolder',
							'folderType': 'Rating'
						});
					}
				}
			});

			OfficialRatings = null;
			if (tableView.length === 0) {
				util.doAlert("No Ratings found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
				return;
			}
			tableView.sort(util.dynamicSort("textLabel"));
			MediaBrowser.createCustomTable(tableView, "Rating", function() {
				MediaBrowser.createInitialListView();
			}, function(x, nt) {
				var item = tableView[x];
				nt.hideTable(function() {
					MediaBrowser.showListOfMoviesByRating(item.textLabel);
				});
				MediaBrowser.lastOpenedCallBack = function() {
					MediaBrowser.showListOfMoviesByRating(item.textLabel);
				};
			});
		});
	},
	showListOfMoviesByRating: function(OfficialRating) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.OfficialRating == OfficialRating) {
					tableView.push({
						'textLabel': (item.WatchedPercentage === 0 ? " " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
						'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
						'icon': "none",
						'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
						'image': util.getRandomMBServer() + "image/?Id=" + item.Id + "&maxwidth=120&maxheight=120",
						'guid': item.Id,
						'type': item.Type,
						'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
						'sortName': item.SortName
					});
				}
			});
			if (tableView.length === 0) {
				util.doAlert("No movies found for this rating.");
				return;
			}
			tableView.sort(util.dynamicSort("sortName"));

			MediaBrowser.createCustomTable(tableView, OfficialRating, function() {
				MediaBrowser.showListOfRating();
			}, function(x, nt) {
				var item = tableView[x];
				var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
				MediaBrowser.playTitle($(tr), item.textLabel, false);
			});
		});
	},
	showListOfIMDBRating: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		var ImdbRatings = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (util.isNumeric(item.ImdbRating) && item.ImdbRating > 0) {
					var imdbRating = Math.floor(item.ImdbRating);
					if (jQuery.inArray(imdbRating, ImdbRatings) == -1) {
						ImdbRatings.push(imdbRating);
						tableView.push({
							'textLabel': imdbRating + " stars",
							'detailTextLabel': "Movies with greater or equal to " + imdbRating + " stars",
							'icon': "greyarrow",
							'sectionHeader': "Movies By Rank",
							'type': 'CustomFolder',
							'folderType': 'imdbRating',
							'imdbRating': imdbRating.toString(),
							'sortOn': (imdbRating < 10 ? '0' : '') + imdbRating
						});
					}
				}
			});

			ImdbRatings = null;
			if (tableView.length === 0) {
				util.doAlert("No imdb ratings found, this can happen if the app does not know enough about your library. You can try to leave the app open for a bit, while indexing occurs.");
				return;
			}
			tableView.sort(util.dynamicSort("-sortOn"));
			MediaBrowser.createCustomTable(tableView, "Rating", function() {
				MediaBrowser.createInitialListView();
			}, function(x, nt) {
				var item = tableView[x];
				nt.hideTable(function() {
					MediaBrowser.showListOfMoviesByIMDBRating(item.imdbRating);
				});
				MediaBrowser.lastOpenedCallBack = function() {
					MediaBrowser.showListOfMoviesByIMDBRating(item.imdbRating);
				};
			});
		});
	},
	showListOfMoviesByIMDBRating: function(rating) {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});
		var tableView = [];
		rating = parseInt(rating, 10);
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (util.isNumeric(item.ImdbRating) && item.ImdbRating > 0) {
					var imdbRating = Math.floor(item.ImdbRating);
					if (imdbRating == rating) {
						tableView.push({
							'textLabel': (item.WatchedPercentage === 0 ? " " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
							'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
							'icon': "none",
							'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
							'image': util.getRandomMBServer() + "image/?Id=" + item.Id + "&maxwidth=120&maxheight=120",
							'guid': item.Id,
							'type': item.Type,
							'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
							'sortName': item.SortName
						});
					}
				}

			});
			if (tableView.length === 0) {
				util.doAlert("No movies found for this rating.");
				return;
			}
			tableView.sort(util.dynamicSort("sortName"));

			MediaBrowser.createCustomTable(tableView, rating.toString, function() {
				MediaBrowser.showListOfIMDBRating();
			}, function(x, nt) {
				var item = tableView[x];
				var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
				MediaBrowser.playTitle($(tr), item.textLabel, false);
			});
		});
	},
	showListOfUnwatched: function() {
		util.doHud({
			show: true,
			labelText: "Loading Data...",
			detailsLabelText: "Please Wait..."
		});

		var tableView = [];
		MediaBrowser.loadGeniusResults(function(geniusResults) {
			$.each(geniusResults.Titles, function(idx, item) {
				if (item.WatchedPercentage === 0) {
					tableView.push({
						'textLabel': (item.WatchedPercentage === 0 ? " " : "") + item.Name + ((item.ProductionYear) ? " (" + item.ProductionYear + ")" : ""),
						'detailTextLabel': (item.ImdbRating ? item.ImdbRating + "/10 " : "") + (item.TagLine ? item.TagLine : ""),
						'icon': "none",
						'sectionHeader': item.SortName.substring(0, 1).toUpperCase(),
						'image': util.getRandomMBServer() + "image/?Id=" + item.Id + "&maxwidth=120&maxheight=120",
						'guid': item.Id,
						'type': item.Type,
						'imdb': ((item.ImdbRating > 0) ? "1" : "0"),
						'sortName': item.SortName
					});
				}
			});
			if (tableView.length === 0) {
				util.doAlert("No unwatched movies found.");
				return;
			}
			tableView.sort(util.dynamicSort("sortName"));

			MediaBrowser.createCustomTable(tableView, "Unwatched", function() {
				MediaBrowser.createInitialListView();
			}, function(x, nt) {
				var item = tableView[x];
				var tr = $("<tr data-guid='" + item.guid + "' data-imdb='" + item.imdb + "'></tr>");
				MediaBrowser.playTitle($(tr), item.textLabel, false);
			});
		});
	},
	startWorker: function(firstRun, forced) {

		var refreshIn = 2880; //2 days
		var current = new Date();
		var lastSeen = util.getItem("lastRefresh");
		if (lastSeen === null) {
			lastSeen = new Date("2010-01-01T23:44:52.790Z");
		} else {
			lastSeen = new Date(lastSeen);
		}
		var minutesSinceLastRefresh = (current.getTime() - lastSeen.getTime()) / 60000;
		var needsRefresh = false;

		if (minutesSinceLastRefresh > refreshIn) {
			needsRefresh = true;
		}

		if (firstRun === true && needsRefresh === false) {
			//just load the pull the results from cache
			//console.log("First run, no refresh");
			return;
		}

		if (firstRun === false && needsRefresh === false) {
			//console.log("no refresh needed");
			return;
		}
		var title = "It's been a while since you last refreshed, \nWould you like to refresh now?";
		if (forced) {
			title = "Refresh Now?";
		}
		navigator.notification.confirm(title, function(buttonIndex) {
			if (buttonIndex == 1) {

				util.doHud({
					show: true,
					labelText: "Checking for new media...",
					detailsLabelText: "Tap to cancel",
					tappedEvent: function() {
						util.setStatusBarForceClear();
						util.doHud({
							show: false
						});
						if (geniusResults) {
							geniusResults.refreshQueue = [];
							geniusResults.TitlesQueue = [];
						}

						$.ajaxq("genuisWorker");
					}
				});

				//Disable the sleep timer
				cordova.require('cordova/plugin/powermanagement').acquire(function() {
					//start out by pulling the root folders, and adding them to the queue
					MediaBrowser.loadGeniusResults(function(geniusResults) {

						//clear the queue
						geniusResults.refreshQueue = [];
						geniusResults.TitlesQueue = [];
						$.ajaxq("genuisWorker");

						util.setStatusBarMessage("Searching for new titles");
						var url = util.getRandomMBServer() + "library?lightData=1";
						console.log(url);
						$.ajax({
							url: url,
							dataType: 'json',
							timeout: settings.userSettings.MBServiceTimeout,
							success: function(d) {
								if (!d.Data) {
									return;
								}
								console.log(d);
								$.each(d.Data.Children, function(key, val) {
									var item = d.Data.Children[key];
									if (item.Type == "Folder") {
										geniusResults.refreshQueue.push({
											Id: item.Id,
											title: item.Name
										});
									}
								});
								//console.log(geniusResults.refreshQueue);
								util.setStatusBarMessage("Searching " + geniusResults.refreshQueue.length + " folders for new titles");
								cache.saveJson("genius", geniusResults);
								MediaBrowser.processGeniusQueue(geniusResults);
							},
							error: function(x, y, z) {
								console.log(x);
								console.log(y);
								console.log(z);
							}

						});
					});
				}, function() {});

			}
			if (buttonIndex == 2) {
				util.setItem("lastRefresh", new Date().toISOString());
			}
		}, "gesturePad", "Refresh,Maybe Later");
	},
	processGeniusQueue: function(geniusResults) {

		//MediaBrowser.loadGeniusResults(function(geniusResults) {
		geniusResults.loaded = true;
		if (geniusResults.refreshQueue.length > 0) {
			//Pull the last folder and queue up all children
			var toProcess = geniusResults.refreshQueue[geniusResults.refreshQueue.length - 1];
			util.setStatusBarMessage("Processing " + toProcess.title);
			var thisURL = util.getRandomMBServer() + "library?lightData=1&Id=" + toProcess.Id;
			$.ajax({
				url: thisURL,
				dataType: 'json',
				timeout: settings.userSettings.MBServiceTimeout,
				success: function(d) {
					var foundOne = false;
					if (d.Data) {
						$.each(d.Data.Children, function(x) {
							var thisObj = d.Data.Children[x];
							var thisId = thisObj.Id;
							if (thisObj.Type == "Movie") {
								//if (thisId === "859cacf9-21ca-2113-3327-d91a6fa7da5a") {
								//	console.log("it");
								//}
								if (!geniusResults.Titles[thisId]) { //doesnt have prev saved metadata
									if (!geniusResults.TitlesQueue[thisId]) { //is not in current queue
										foundOne = true;
										geniusResults.TitlesQueue[thisId] = {};
										$.ajaxq("genuisWorker", {
											url: util.getRandomMBServer() + "library/?Id=" + thisId + "&lightData=0",
											dataType: 'json',
											timeout: settings.userSettings.MBServiceTimeout,
											success: function(x) {
												MediaBrowser.saveGeniusResult(x, geniusResults);
											},
											error: function() {
												console.log("error");
												delete geniusResults.TitlesQueue[thisId];
											}
										});
									}
								}
							}
						});
					} else {
						console.log("no data in response.");
					}

					if (foundOne === false) {
						//console.log("nothing new");
						util.setStatusBarMessage(toProcess.title + " Completed");
						geniusResults.refreshQueue.pop();
						MediaBrowser.processGeniusQueue(geniusResults);
					}
				},
				error: function() {
					console.log("process error");
				}
			});
		} else {
			//release the power lock
			cordova.require('cordova/plugin/powermanagement').release(function() {
				//unlocked
			}, function() {});

			util.doHud({
				show: false
			});

			util.setStatusBarMessage("All Titles Indexed.");
			setTimeout(function() {
				util.setItem("lastRefresh", new Date().toISOString());
				util.setStatusBarForceClear();
				MediaBrowserNowPlaying.allItemsPopulated = false;
			}, 1500);
		}
		//});
	},
	saveGeniusResult: function(d, geniusResults) {
		//MediaBrowser.loadGeniusResults(function(geniusResults) {
		var movieObject = d.Data;
		var id = movieObject.Id;

		//save it
		geniusResults.Titles[id] = movieObject;
		//remove it from queue
		delete geniusResults.TitlesQueue[id];

		var remaining = Object.keys(geniusResults.TitlesQueue).length;
		if (remaining % 10 === 0) { //alert the user, and save results every 10 items
			//save to disk
			cache.saveJson("genius", geniusResults);
			var parentFolder = "";
			//try to get the name of the parent folder
			$.each(geniusResults.refreshQueue, function(x) {
				if (geniusResults.refreshQueue[x].Id == movieObject.parentId) {
					parentFolder = geniusResults.refreshQueue[x].title;
				}
			});
			util.setStatusBarMessage("Indexing " + remaining + " " + parentFolder + " Titles");
			util.doHud({
				show: false
			});
			util.doHud({
				show: true,
				labelText: "Indexing " + remaining + " " + parentFolder + " Titles",
				detailsLabelText: "Tap to cancel",
				tappedEvent: function() {
					util.doHud({
						show: false
					});
					if (geniusResults) {
						geniusResults.refreshQueue = [];
						geniusResults.TitlesQueue = [];
					}
					$.ajaxq("genuisWorker");
				}
			});
		}

		if (remaining % 50 === 0) { //clear the status every 25 items
			util.setStatusBarForceClear();
		}

		if (remaining === 0) {
			//folder was totally indexed, do next
			geniusResults.refreshQueue.pop();
			cache.saveJson("genius", geniusResults);
			MediaBrowser.processGeniusQueue(geniusResults);
		}
		//});
	}

};