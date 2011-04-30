/* Javascript for OpenPCR
 *
 * http://openpcr.org
 * Copyright (c) 2011 OpenPCR
 */
 
 /*
 * This code is generally broken up into 3 sections, each having to do with the 3 main pages of the OpenPCR interface
 * 1. Home screen and initialization
 * 2. Form screen, entering the PCR protocol
 * 3. Running screen, displaying live information from OpenPCR
 * 4. Buttons
 */

/**************
* Home screen*
***************/
	
	// declare the appUpdater variable
	var appUpdater;
	
	/* init()
	* Called when the app is loaded.
	* Checks to see if OpenPCR is plugged in (gets the device path if it is) and checks to see if there is an Air update available
	*/
	
	function init()
		{
		// get the location of OpenPCR (can be null)
		var deviceLocation = pluggedIn();
		
		// if OpenPCR is plugged in
		if (deviceLocation != null)
		{
			// get the path for OpenPCR
				var devicePath = new air.File(); 
				devicePath.nativePath = deviceLocation;
			// store the path to a window variable for later use
				window.path = devicePath;
		}
			
		// Application Updater code		
			setApplicationNameAndVersion();	
			appUpdater = new air.ApplicationUpdaterUI();
		// App updater config file
			appUpdater.configurationFile = new air.File("app:/config/update-config.xml");
			appUpdater.addEventListener(air.ErrorEvent.ERROR, onError);
			appUpdater.initialize();
		// Display the list of Saved Experiments on the home page
			listExperiments();
		// get ready to validate the OpenPCR form
			$("#pcrForm").validate();
		
		}
	
	/* listExperiments()
	* Updates the list of Saved Experiments on the home page. Grabs all the files in the Experiments folder and lists them alphabetically
	*
	*/
	function listExperiments()
	{
		// start a drop down menu
		presetsHTML = "<select id='dropdown'>";
		// look for "Experiments" directory
		searchDir = air.File.applicationStorageDirectory.resolvePath("Experiments");
		// create the "Experiments" directory if one doesn't exist already
		searchDir.createDirectory();
		// get a list of all files in the folder
		window.experimentList = searchDir.getDirectoryListing();
		// Loop through and add each filename as "option" values for the drop down
		var presetsList = "";
		for (var f = 0; f < window.experimentList.length; f++)
			{
				if (window.experimentList[f].isDirectory) {
						// if the file is a directory, don't add it to the list
						if (window.experimentList[f].name !="." && window.experimentList[f].name !="..") {}
				} else {
					// get the filename
					fileName = window.experimentList[f].name;
					// take off the .pcr extension
					var experimentName =  fileName.substring(0, fileName.indexOf('.pcr'));
					// if the file was type .pcr, add the filename as an option for the drop down
					if (fileName.length != experimentName.length && experimentName != "")
						{
							presetsHTML += '<option value="' + f + '">' + experimentName + "</option>";
						}
				}
			}
		
		// if blank, add a "No Saved Experiments" item
		if (presetsHTML == "<select id='dropdown'>")
			{
				presetsHTML += '<option value=1>-none-</option>'; 
			}

		// close the drop down HTML tags
		presetsHTML += "</select>";
		// update the HTML on the page
		$("#reRun").html(presetsHTML);
		
	}
	
	/* listSubmit()
	* Loads the currently selected experiment in the list on the home page
	*/
	function listSubmit()
	{
		// what is selected in the drop down menu?
		experimentID = $("#dropdown").val();
		// load the selected experiment
		loadExperiment(experimentID);
	}
	
		/* pluggedIn()
		* Checks that a volume named "OpenPCR" is mounted on the computer
		* Returns: deviceLocation (null if not plugged in)
		*/
	function pluggedIn()
		{
		var volInfo = air.StorageVolumeInfo.storageVolumeInfo;
		// wait for a USB device to be plugged in
		volInfo.addEventListener(air.StorageVolumeChangeEvent.STORAGE_VOLUME_MOUNT, function(e){
				// if the name is OpenPCR, then set the window variable pluggedIn to "true". otherwise do nothing
				var pattern = /OpenPCR/;
				// if the nativePath contains "OpenPCR"
				if (pattern.test(e.rootDirectory.nativePath))
					{
					// re-set the path to OpenPCR
				var deviceLocation = e.rootDirectory.nativePath;
				var devicePath = new air.File(); 
				devicePath.nativePath = deviceLocation;
			// store the path to a window variable for later use
				window.path = devicePath;
					//window.path=deviceLocation.nativePath;
					// update the UI
					if($("#Unplugged").is(':visible'))
						{
						// if the "Unplugged" button is visible, switch it to "Start"
						$("#Unplugged").hide();
						$("#Start").show();
						}
					// and next time we check the status, make sure it shows plugged in
					window.pluggedIn=true;
					// and, set the running page to be normal
					$("#runningUnplugged").hide();
					$("#runningPluggedIn").show();
					}
				else
					{
					// otherwise it isn't OpenPCR that was plugged in
					}
				});
		// wait for a USB device to be unplugged
		volInfo.addEventListener(air.StorageVolumeChangeEvent.STORAGE_VOLUME_UNMOUNT, function(e){
				// air doesn't store the name of what was unplugged, so does the nativePath match OpenPCR
				nativePath = e.rootDirectory.nativePath
				// if the device unplugged contained "OpenPCR"
				var pattern = /OpenPCR/i;
				if (pattern.test(nativePath))
					{
						if($("#Start").is(':visible'))
						{
						// if the "Start" button is visible, hide it and show "Unplugged" instead
						$("#Start").hide();
						$("#Unplugged").show();
						
						}
						// and next time we check the status, make sure it shows unplugged
						window.pluggedIn=false;
						
						// and, change the running screen to tell the user OpenPCR is unplugged
						$("#runningUnplugged").show();
						$("#runningPluggedIn").hide();
					}
				else
					{
					// otherwise it isn't OpenPCR that was unplugged
					}
					});
		// get a list of the current Volumes mounted on the computer
			var volumesList = air.StorageVolumeInfo.storageVolumeInfo.getStorageVolumes();
		// look in the list for a Volume named "OpenPCR"
			var pattern = /OpenPCR/i;
			for (var i = 0; i < volumesList.length; i++)
				{
					
					var directory = volumesList[i].rootDirectory.nativePath;
					if (pattern.test(volumesList[i].name))
						{
						var deviceLocation = directory;
						}
				}
			if (deviceLocation == null)
				{
				// if device is not plugged in...
				window.pluggedIn=false;
				// and put a message over the Running screen
				
				}
			else
				{
				// otherwise, make sure the "Start" button is correclty displayed and the Running screen is correctly displayed
				window.pluggedIn=true;
				}
				
			return deviceLocation;
		}
		
		/* loadExperiment();
		* loads the experiment with the given experimentID
		*/
		function loadExperiment(experimentID)
			{
			// Now we've made all the modifications needed, display the Form page
				sp2.showPanel(1);
			// clear the experiment form
			clearForm();
			// given an experiment ID, get the path for that ID
			experimentPath = window.experimentList[experimentID];
			// if the experiment id doesn't exist, exit and do nothing
			if (experimentPath == null) { return 0; }
			// read in the file
			experimentJSON = JSON.parse(readFile(experimentPath));
			// loads filen into the Form and moves onto Form page
			experimentToHTML(experimentJSON);
			// update the buttons to make sure everything is ready to re-run an experiment
			reRunButtons();
			
			}

		/*  newExperiment()
		* This function is called when the "New Experiment" button is clicked on the Home page
		* This function brings up a blank experiment
		*/
		
		function newExperiment()
		{
		// clear the experiment form
			clearForm();
		// set up the blank experiment
		var experimentJSON = 
				{
				"name": "New Experiment",
				"steps": [
							{ "type": "cycle",
								"count": "",
								"steps" : [
											{ "type": "step",
												"name": "Denaturing",
											  "time": "",
												"temp": ""
											},
											{ "type": "step",
												"name": "Annealing",
											  "time": "",
												"temp": ""
											},
											{ "type": "step",
												"name": "Extending",
											  "time": "",
												"temp": ""
											}
										]
										},
							{   "type": "step",
								"name": "Final Hold Temperature",
								"temp": "4",
							    "time": 0
							}
						]
				};
		experimentToHTML(experimentJSON);
		
		// set interface to have the right buttons
		newExperimentButtons();
		// Now we've made all the modifications needed, display the Form page
		sp2.showPanel(1);
		}
		
/**************
* Form screen*
***************/

		/* startOrUnplugged(display)
		* Determines whether to display the "Start" or "Unplugged" button on the Form page.
		* Input: CSS display status of the button
		*/
		function startOrUnplugged(display)
		{
		//pick the Start or Unplugged button based on whether the device is plugged in or not
		// if plugged in then
		if (window.pluggedIn==true)
			{
			// then we definitely want to hide the "Unplugged" button
			$("#Unplugged").hide();
			// and maybe want to show/hide the "Start" button, whatever was submitted as the "display" var
			$("#Start").css("display", display)
			// and, change the running screen to plugged in
						$("#runningUnplugged").hide();
						$("#runningPluggedIn").show();
			}
		else 
			{
			// else, device is unplugged
			// then we definitely want to hide the "Start" button
			$("#Start").hide();
			// and maybe want to show/hide the "Unplugged" button, whatever was submitted as the "display" var
			$("#Unplugged").css("display", display)
			// change the running screen to unplugged
						$("#runningUnplugged").show();
						$("#runningPluggedIn").hide();
			
			}
		}
		
		/* reRunButtons()
		* puts Form buttons in the state they should be immediately following loading an experiment
		*/
		function reRunButtons()
		{
		// Hide the Delete button
			$('#deleteButton').hide();
		// Start with the edit button shown
			$("#editButton").show();
		// Start with the edit buttons hidden
			$(".edit").hide();
		// all fields locked
			$("input").attr("readonly","readonly");
		// and 'More options' hidden
			$('#OptionsButton').hide();
		// Hide the Save button
			$('#Save').hide();
		// Hide the Cancel button
			$('#Cancel').hide();
		// Hide the SaveEdits button
			$('#SaveEdits').hide();
		// Show the Start/Unplugged button
			startOrUnplugged("inline");
			$('#singleTemp').hide();
		// pre and post containers should take care of themselves
		}
		
		/* newExperimentButtons()
		* puts Form buttons in the state they should be for a new experiment
		*/
		function newExperimentButtons()
		{
		// Hide the Delete button
			$('#deleteButton').hide();
		// Start with the edit button hidden
			$("#editButton").hide();
		// Start with the edit buttons hidden
			$(".edit").hide();
		// all fields editable
			$("input").attr("readonly","");
		// and 'More options' shown
			$('#OptionsButton').show();
		// Show the Save button
			$('#Save').show();
		// Hide the Cancel button
			$('#Cancel').hide();
		// Hide the SaveEdits button
			$('#SaveEdits').hide();
		// Show the Start/Unplugged button
			startOrUnplugged("inline");
			$('#singleTemp').hide();
		// make sure the "More options" button says so
		$('#OptionsButton').html("More options");
		}

	/* readoutExperiment
	* Reads out all the variables from the OpenPCR form.
	* Stored in JSON format either to "Save" the experiment or send it to OpenPCR
	*/
	function readoutExperiment()
	{
		// grab the Experiment Name
		experimentName = document.getElementById("ExperimentName").innerHTML;
		// grab the pre cycle variables if any exist
			preArray = [];
			$("#preContainer .textinput").each(function(index, elem)
					{
					//just throw them in an array for now
					if ($(this) != null) preArray.push($(this).val());
					});
					
		// grab the cycle variables
			cycleArray = [];
			$("#cycleContainer .textinput").each(function(index, elem)
					{
					//just throw them in an array for now
					cycleArray.push($(this).val());
					});
			
		// grab the post cycle variables if any exist
			postArray = [];
			$("#postContainer .textinput").each(function(index, elem)
					{
					//just throw them in an array for now
					postArray.push($(this).val());
					});
					
		// grab the final hold steps if any exist
			holdArray = [];
			$("#holdContainer .textinput").each(function(index, elem)
					{
					//just throw them in an array for now
					holdArray.push($(this).val());
					});
			
		
		// Push variables into an experiment JSON object
		var experimentJSON = new Object();
		// Experiment name
		experimentJSON.name = experimentName;
		experimentJSON.steps = [];
		// Pre Steps
		// every step will have 2 elements in preArray (temp,time)
		preLength = (preArray.length)/2;
		for (a=0 ; a < preLength; a++)
				{
				experimentJSON.steps.push(
					{   "type": "step",
						"name": "Initial Step",
						"temp": preArray.shift(),
						"time": preArray.shift()
					});
				}
		
		// Cycle and cycle steps
		// the cycle will be a # of cycles as the first element, then temp/time pairs after that
			if (cycleArray.length > 0)
			{
				experimentJSON.steps.push(
					{  
					"type": "cycle",
					// add the number of cycles
					"count": cycleArray.shift(),
					"steps": [] 
					});
				
				// then add the cylces
				current = experimentJSON.steps.length-1;
				
				// every step will have 2 elements in cycleArray (Time and temp)
				cycleLength = (cycleArray.length)/2;
				for (a=0 ; a < cycleLength; a++)
					{
						
						experimentJSON.steps[current].steps.push(
						{
							"type": "step",
							"name": "Step",
							"temp": cycleArray.shift(),
							"time": cycleArray.shift()
						});
					}
			}
			
			
		// every step will have 2 elements in preArray (Time and temp)
		// a better way to do this would be for a=0, postArray!=empty, a++
		postLength = (postArray.length)/2;
		for (a=0 ; a < postLength; a++)
				{
				experimentJSON.steps.push(
				{   "type": "step",
					"name": "Final Step",
					"temp": postArray.shift(),
					"time": postArray.shift()
				});
				}
			
		// Final Hold step
			if (holdArray.length > 0)
				{
				experimentJSON.steps.push(
					{   "type": "step",
						"name": "Final Hold Temperature",
						"time": 0,
						"temp": holdArray.shift()
					});
				}
					
		// return the experiment JSON object
		return experimentJSON;
		}
		
	/* Save(name)
	* Writes out the current window.experiment to the app:/Experiments directory
	* Input: name, name of the file to be written out (add .pcr extension)
	*/
	function Save(name)
	{
		// create the filename
			fileName = name + ".pcr";
		// grab the current experiment and update window.experiment
			pcrProgram = readoutExperiment();
		// update the name of the experiment
			pcrProgram.name = name;
		// turn the pcrProgram into a string
			pcrProgram = JSON.stringify(pcrProgram, null, '\t');
		// set the destination folder for the file
			fileDestination = air.File.applicationStorageDirectory.resolvePath("Experiments");
		// create the "My Presets" directory if one doesn't exist already
			fileDestination.createDirectory();
		// set the filename
		fileDestination = fileDestination.resolvePath(fileName);
		// write out the file
			var fileStream = new window.runtime.flash.filesystem.FileStream();
			fileStream.open(fileDestination, window.runtime.flash.filesystem.FileMode.WRITE); 
			fileStream.writeUTFBytes(pcrProgram); 
			fileStream.close();
		// show a confirmation screen
		$('#save_confirmation_dialog').dialog('open');
		// then close it after 1 second
		setTimeout(function(){$('#save_confirmation_dialog').dialog('close');}, 750);
	}

	/* experimentToHTML(inputJSON)
		* Takes a given experiment JSON and loads it into the OpenPCR interface
		*/
		function experimentToHTML(inputJSON)
		{
			// store the experiment to the JSON. This can be modified using the interface buttons, sent to OpenPCR, or saved
			window.experiment = inputJSON;
			// clear the Form
			clearForm();
			// Update the experiment name
			var experimentName = inputJSON.name;
			$("#ExperimentName").html(experimentName);
			
			// for every .steps in the experiment, convert it to HTML
			var experimentHTML = "";
			// break the rest of the experiment up into "pre cycle" (0), "cycle" (1), and "post cycle" (2) sections
			var count = 0;
			// 4 possibile DIVs
			// pre-steps, cycle steps, post-steps, and final hold step
				// Add the experiment to the page	
						for (i=0; i < inputJSON.steps.length; i++)
				{
					// pre-cycle to start
					if (count==0 & inputJSON.steps[i].type == "step")
					// if it's for pre-cycle
						{
						// show the preContainer div
						$('#preContainer').show();
						$('#preSteps').append(stepToHTML(inputJSON.steps[i]))
						}
					
					else if (count==0 && inputJSON.steps[i].type == "cycle")
					// if it's cycle, put the cycle in the Cycle container
					{
						$('#cycleContainer').show();
						$('#cycleSteps').append(stepToHTML(inputJSON.steps[i]));
						count=1;
					}
				
					else if (count==1 && inputJSON.steps[i].type == "step" && inputJSON.steps[i].time != 0)
					// if it's post (but not a final hold), put the steps in the Post container
					{
						$('#postContainer').show();
						$('#postSteps').append(stepToHTML(inputJSON.steps[i]));
					}
					
					else if (count==1 && inputJSON.steps[i].type == "step" && inputJSON.steps[i].time == 0)
					// if it's the final hold (time = 0), put it in the final hold container
					{
						$('#holdContainer').show();
						$('#holdSteps').append(stepToHTML(inputJSON.steps[i]));
					}
				
				}	
		}
		
		/* stepToHTML(step)
		* Turns a step into HTML. However, this HTML doesn't have a container div/fieldset
		* If the step is a cycle, it will return html with all the cycles represented.
		* If the step is a single step, html with just one cycle is returned
		*/
		
	function stepToHTML(step)
		{
		stepHTML = "";
		// if cycle
		if (step.type=="cycle")
		 {
			// printhe "Number of Cycles" div
			stepHTML += '<label for="number_of_cycles"></label><div><span class="title">Number of Cycles:</span><input type="text" name="number_of_cycles" id="number_of_cycles" class="required number textinput" maxlength="4" min="0" max="1000"  value="' + step.count + '"></div><br />';
			// steps container
			// print each individual step
			for (a=0; a<step.steps.length; a++)
					{
					// make the js code a little easier to read
					step_number = a;
					step_name = step.steps[a].name;
					step_temp = step.steps[a].temp;
					step_time = step.steps[a].time;
					
					// print HTML for the step
					stepHTML += '<div class="step"><span id="step' + step_number + '_name" class="title">' + step_name + ' </span><a class="edit deleteStepButton"><img src="images/minus.png" height="30"></a><table><tr><th><label for="step' + step_number + '_temp">temp:</label> <div class="step' + step_number + '_temp"><input type="text" style="font-weight:normal;" class="required number textinput" name="step' + step_number + '_temp" id="step' + step_number + '_temp" value="' + step_temp + '" maxlength="4" min="-20" max="150" ></div><span htmlfor="openpcr_temp" generated="true" class="units">&deg;C</span> </th><th><label for="step' + step_number + '_time">time:</label> <div class=""><input type="text" class="required number textinput"  style="font-weight:normal;" name="step' + step_number + '_time" id="step' + step_number + '_time" value="' + step_time + '" maxlength="4" min="0" max="1000"  ></div><span htmlfor="openpcr_time" generated="true" class="units">sec</span></th></tr></table></div>';
			
					}
		 }
		// if single step
		else if (step.type=="step")
		 {
		 // make the js code a little easier to read
		 step_number = new Date().getTime();
		 step_name = step.name;
		 step_time = step.time;
		 step_temp = step.temp;
		
		// main HTML, includes name and temp
		stepHTML += '<div class="step"><span id="' + step_number + '" class="title">' + step_name + ' </span><a class="edit deleteStepButton"><img src="images/minus.png" height="30"></a><table cellspacing="20"><tr><th><label>temp:</label> <div><input type="text" style="font-weight:normal;" class="required number textinput" value="'+ step_temp + '" maxlength="4" name="temp_' + step_number + '" min="0" max="120" ></div><span htmlfor="openpcr_temp" generated="true" class="units">&deg;C</span> </th>';
		
		 // if the individual step has 0 time (or blank?) time, then it is a "hold" step and doesn't have a "time" component
		if (step_time != 0)	
				{
				stepHTML += '<th><label>time:</label> <div class=""><input type="text" class="required number textinput" style="font-weight:normal;" value="' + step_time + '" name="time_' + step_number + '" maxlength="4" min="0" max="1000"></div><span htmlfor="openpcr_time" generated="true" class="units">sec</span></th>';
				//stepHTML += '<label for="step' + step_name + '_time">time:</label> <div class=""><input type="text" class="required number textinput"  style="font-weight:normal;" name="step' + step_number + '_time" id="step' + step_number + '_time" value="' + step_time + '" min="-20" max="150" ><span htmlfor="openpcr_time" generated="true" class="units">sec</span></div>';
				}
		 }
		else alert("Error #1986");
		stepHTML += '</tr></table></div>';
		return stepHTML;
		}
		
	/* clearForm()
	* Reset all elements on the Forms page
	*/
	function clearForm()
	{
	// empty everything
	$('#preSteps').empty();
	$('#cycleSteps').empty();
	$('#postSteps').empty();
	$('#holdSteps').empty();
	// hide everything
	$('#preContainer').hide();
	$('#cycleContainer').hide();
	$('#postContainer').hide();
	$('#holdContainer').hide();
	
	// reset the size of the DIV to 700 px
	//defaultHeight = "700";
	//$(".SlidingPanelsContent").height(defaultHeight);
	//$(".SlidingPanels").height(defaultHeight);
	}
	
function disableEnterKey(e)
{
     var key;      
     if(window.event)
          key = window.event.keyCode; //IE
     else
          key = e.which; //firefox      

     return (key != 13);
}
	

/**************
* Running screen*
***************/

/* running(path)
	* Controls the "running" page of OpenPCR. Reads updates from the running.pcr control file on OpenPCR every 250 ms
	* Input: path, the location of the running.pcr control file
	*/
	
	function running(path)
		{
		// Listen for VolumeChangeEvents so we can know if OpenPCR gets unplugged?
			
		// Find the running file containing the current OpenPCR data
			window.runningFile = path;
			window.runningFile = window.runningFile.resolvePath("running.pcr");
		
		// check the running file exists
		// if so
		// update the running page once
			updateRunning();
		// refresh the running page every 250 ms
			setInterval(updateRunning,250);
		
		// otherwise, re-check continuously for the next 10 seconds
		// after 10 seconds, throw an error
		//alert("There has been a problem starting OpenPCR");
		}
	
	/* updateRunning
	* Updates the Running page variables
	*/
	function updateRunning()
		{
		// does the running file exist? if not, return
		if (!window.runningFile.exists) { return 0; }
		// otherwise, update the running page
		updateFile = readFile(window.runningFile);
		var status = JSON.parse(updateFile);
		
		// if command id in the running file doesn't match, say so and then quit
					if (status["command_id"]!=window.command_id)
						{
						alert("OpenPCR command_id does not match running file. This error should not appear");
				// quit
						air.NativeApplication.nativeApplication.exit();
						}
				
				if (status["status"]=="running")
					{
					// preset name
						var prog_name = status["prog_name"];
						$("#runningHeader").html(prog_name);
						
					// set variable for percentComplete
						var percentComplete = 100 * status["seconds_elapsed"]/(status["seconds_elapsed"]+status["seconds_remaining"]);
					// Progress bar
						$("#progressbar").progressbar({ value: percentComplete});
					
					// Time Remaining
						var secondsRemaining = parseInt(status["seconds_remaining"]);
						if (secondsRemaining == 0) 
								{
									timeRemaining='<span style="color:#04B109;">Done!</span>';
								}
							else
								{
									var timeRemaining = humanTime(secondsRemaining);
								}
						$("#minutesRemaining").html(timeRemaining);
						
					// Current step name
						var current_step = status["state"];
						$("#currentStep").html(current_step);
				
					// Current step time remaining
						var step_seconds_remaining = status["step_seconds_remaining"];
						$("#stepSecondsRemaining").html(step_seconds_remaining);
					// Current cycle #
						var current_cycle = status["cycle_number"];
						$("#cycleNumber").html(current_cycle);
						
					// Total # of cycles
						var total_cycles = status["num_cycles"];
						$("#totalCycles").html(total_cycles);
						
					// Current temp
						var block_temp = status["block_temp"];
						$("#blockTemp").html(block_temp);
						
					// Current lid temp
						var lid_temp = status["lid_temp"];
						$("#lidTemp").html(lid_temp);
					}
				else if (status["status"]=="complete")
					{
					// if the status of OpenPCR comes back as "complete"
					// hide the cancel button
					$("#cancelButton").hide();
					// show the completed message
					timeRemaining='<span style="color:#04B109;">Done!</span>';
					// hide "Time remaining" span
					$("#timeRemaining").hide();
					// update the "current temp"
					var block_temp = status["block_temp"];
						$("#blockTemp").html(block_temp);
					// update the lid temp
					var lid_temp = status["lid_temp"];
					$("#lidTemp").html(lid_temp);
					// replace the "cycle # of total#" span with "PCR took..."
					$("#cycleNumOfNum").html("PCR took " + humanTime(status["seconds_elapsed"]));
					// i.e. hide the "Holding for 10 sec", just show "Holding"
					$("#stepRemaining").hide();
					// Current step name
							var current_step = status["state"];
							$("#currentStep").html(current_step);
					//and "elapsed time" (elapsed time could be static)
					//status["seconds_elapsed"]
//					$("#minutesRemaining") = "PCR took" + humanTime(100);
					}
				else if (status["status"]=="stopped")
					{
					// nothing, this shouldn't be a status that is read in
					}
				else if (status["status"]=="error")
					{
					// error
					alert("Error");
					}
		}
		

		/* readFile()
		* Opens a given filestream and reads it into a varaiable
		* (If the file does not exist, should be an error!) 
		*/
		function readFile(filePath)
		{
			stream = new air.FileStream();
			if (filePath.exists) {
				stream.open(filePath, air.FileMode.READ);
			// get the file and put it in a variable
				theFile = stream.readUTFBytes(stream.bytesAvailable);
				stream.close();
				return theFile;
			}
			else
			{
				// if the file is not found, nothing
				air.trace(filePath.name+ " not found");
			}
			
			// what's this for?
			window.nativeWindow.visible = true;
		}
	
	/* humanTime()
	* Input: seconds (integer)
	* Returns: time in a human friendly format, i.e. 2 hours, 10 minutes, 1 hour, 10 minutes, 1 hour, 1 minute, 60 minutes, 1 minute
	*/
	function humanTime(secondsRemaining)
		{
			var timeRemaining="";
			var minutesRemaining = Math.floor(secondsRemaining/60);
			var hoursRemaining = Math.floor(minutesRemaining/60);
				if (hoursRemaining>0)
					{
					timeRemaining+= hoursRemaining + " hour";
					if (hoursRemaining>1) 
						{
						timeRemaining+="s ";
						}
						else {timeRemaining+=" ";}
					minutesRemaining-=(hoursRemaining)*60;
					}
						if (minutesRemaining>1)
								{
								timeRemaining+=minutesRemaining + " minutes";
								}
						else if (minutesRemaining==1)
							{
							timeRemaining+= "1 minute";
							}
						else if (secondsRemaining<=60)
							{
							// should say "less than a minute" but font is too big
							timeRemaining+= "1 minute";
							}
						else if (secondsRemaining==0)
							{
							timeRemaining = "Done!";
								}
			return timeRemaining;
		}
		
/**************
* Buttons     *
***************/

	/*  "About" button on the OpenPCR Home page
	* Displays about info
	*/		
	 $('#About').live('click', function(){
						$('#about_dialog').dialog('open');
				 });
	
	/*  "Home" button on the OpenPCR Form page
	* Goes Home
	*/	
	$('#Home').live('click', function(){
					listExperiments();
					sp2.showPanel(0);
					setTimeout(clearForm,500);
				 });
		 
	/*  "Start" button on the OpenPCR Form page
	* Sends an experiment to OpenPCR and switches to the Running page
	*/	
	$('#Start').live('click', function(){
			// go to the Running dashboard
			sp2.showPanel(2);
			$('#starting').dialog('open');
		// then close it after 1 second
		setTimeout(function(){$('#starting').dialog('close');}, 750);
			// check if the form is validated
			if (false == ($("#pcrForm").validate().form()))
				{ return 0;} // if the form is not valid, show the errors
			// grab the current timestamp
			var currentTime = new Date();
			// command_id will be the timestamp (currentTime), stored to the window for later use
	///// set to 1111 for testing purposes, should be currentTime in the future
			window.command_id = 1111;
			// where is OpenPCR
				var devicePath =  window.path;
			// name of the output file written to OpenPCR
				var controlFile = devicePath.resolvePath("control.pcr"); 
			// grab all the variables, command id + PCR settings, in JSON format.
			// Start with the command id, which 
				var pcrProgram = "{\n\t\"command_id\": " + window.command_id + ",\n";
			// add on the experiment
			// not funtional yet

			// get all the variables from the pre-cycle, cycle, and post-cycle steps
			pcrProgram += "\t\"protocol\": " + JSON.stringify(readoutExperiment(), null, '\t\t');
			pcrProgram += "\n";
			pcrProgram += "\"contrast\": 50\n}";
			
			// write out the file.  This file will then be read by the OpenPCR device
				var fileStream = new window.runtime.flash.filesystem.FileStream();
				fileStream.open(controlFile, window.runtime.flash.filesystem.FileMode.WRITE); 
				fileStream.writeUTFBytes(pcrProgram); 
				fileStream.close();
			// load the OpenPCR Running page
			running(path);
			
	//// is this boolean necessary
		});
					
	/*  "Save" button on the OpenPCR Form
	 * Ask for a "name" and save the protocol to name.pcr in the user's Experiments folder
	 */		
	 $('#Save').live('click', function(){
				 // Save Dialog
				 // check if the form is validated
						if (false == ($("#pcrForm").validate().form()))
							{ return 0; // if not, don't do anything
							}
				// otherwise, the form is valid. Open the "Save" dialog box
						$('#save_form').dialog('open');
		 });
				 
	/*  "Save" on the OpenPCR Form in EDIT MODE
	* This will overwrite the old experiment with the edited settings
	*/		
	$('#SaveEdits').live('click', function(){
			 // check if the form is validated
					if (false == ($("#pcrForm").validate().form()))
						{ 
							return 0; // if not, don't do anything
						}
			 // Grab the Experiment name, could also do this by reading from the experiments list on the homepage
			 name = document.getElementById("ExperimentName").innerHTML;
			 // Save the file, overwriting the existing file
			 Save(name);
			 // re-load the experiment with the new settings
			loadExperiment(experimentID);
	 });
				 
	/*  "Cancel" button on the OpenPCR Form in EDIT MODE
	* This will cancel any changes made to the form and re-load the experiment as it was last saved
	*/		
	$('#Cancel').live('click', function(){
			// what is selected in the drop down menu on the front page?
			experimentID = $("#dropdown").val();
			// clear the form
			clearForm();
			// load the selected experiment
			loadExperiment(experimentID);
			 });
	
	
	/*  "Edit" button on the OpenPCR Form with a saved experiment
	*/	
	$('#editButton').live('click', function(){
		editButton();
		});
	
	/*  "Delete" button on the OpenPCR Form in EDIT MODE
	*/	
	$('#deleteButton').live('click', function(){
		$('#delete_dialog').dialog('open');
		});
	
	/*  "+ Add Step" button on the OpenPCR Form
	* Add a new blank step to the end of the presets
	*/	
	$('#addStepButton').live('click', function() {
		var location = $(this).parent().attr("id");
		addStep(location);
		});
	
	/*  "- Delete Step" on the OpenPCR Form
	* Delete the step
	*/	
	$('.deleteStepButton').live('click', function() {
		$(this).parent().slideUp('slow', function() {
			// after animation is complete, remove parent step
			$(this).remove();	
	//// if the length is now 0, hide the whole div
			});
	
	});
	
	/*  "More options" button on the OpenPCR Form
	* Display a bunch of options
	*/
	$('#OptionsButton').live('click', function() {
		$(".edit").toggle();
		$("#preContainer").show();
		$("#postContainer").show();
		// get current state
		buttonText = document.getElementById("OptionsButton").innerHTML;
		// if we're hiding the options and there are no pre-steps or post-steps, hide those sections appropriately
		if (buttonText == 'Less options' && $("#preSteps").html() == "")
				{
			// hide pre steps
				$("#preContainer").hide();
				}
			if (buttonText == 'Less options' && $("#postSteps").html() == "")
				{
			// hide post steps
				$("#postContainer").hide();
				}
		// flip the Options button text between "More options" and "Less options"
		var buttonText = (buttonText != 'More options' ? 'More options' : 'Less options' );
		$('#OptionsButton').html(buttonText);	
		});
		
// Presets page
		/* editButton()
		* Function that is called when the "Edit" button is pressed on a "Saved Preset" page. Makes the "Save preset" and "Cancel" buttons
		* show up, "Add" and "Subtract" steps buttons, and makes all fields editable
		* Returns: nothing
		*/
		function editButton()
		{
			
		// Show the Delete button
		$('#deleteButton').show();
		// Start with the Edit button hidden
			$("#editButton").hide();
		// show the edit buttons
			$(".edit").show();
		// all fields editable
			$("input").attr("readonly","");
		// and 'More options' hidden
			$('#OptionsButton').hide();
		// hide the Save button
			$('#Save').hide();
		// show the Cancel button
		$('#Cancel').show();
		// show the SaveEdits button
		$('#SaveEdits').show();
		// Hide the Start/Unplugged button
		startOrUnplugged("none");
		// show the Single Temp mode button
		$('#singleTemp').show();
		// show the Add Step buttons
			$("#preContainer").show();
			$("#postContainer").show();
		}
		
		/* deleteCurrentExperiment()
		* Deletes the currently loaded experiment (whatever was last selected in the list)
		* Called by the delete dialog box
		*/
		function deleteCurrentExperiment()
		{
		// delete the currently loaded Experiment file
		// given an ID, get the path for that ID
		experimentPath = window.experimentList[experimentID];
		// delete the file
		var file = experimentPath; 
		file.deleteFile();
		// show a confirmation screen
		$('#delete_confirmation_dialog').dialog('open');
		// then close it after 1 second
		setTimeout(function(){$('#delete_confirmation_dialog').dialog('close');}, 750);

		// 
		}
		
		/* addStep()
		* Add the HTML for a blank step to the desired css selector div
		*/
		function addStep(location)
		{
			// first off, if the location is cycleContainer, we really want to modify stepsContainer
			if (location == "cycleContainer")
				{
				location = "cycleSteps";
				}
			// add to HTML
			if (location=="preSteps") { step_name="Initial Step" }
			if (location=="postSteps") { step_name="Final Step" }
			if (location=="cycleSteps") { step_name="Step" }
			step_number = new Date().getTime();;
			var step = '<div class="step"><span class="title">' + step_name + ' </span><a class="edit deleteStepButton"><img src="images/minus.png" height="30"></a><table cellspacing="20"><tr><th><label>temp</label> <div><input type="text" style="font-weight:normal;" class="required number textinput" value="" name="temp_' + step_number + '" maxlength="4" min="0" max="120" ></div><span htmlfor="openpcr_temp" generated="true" class="units">&deg;C</span> </th><th><label>time</label> <div class=""><input type="text" class="required number textinput" style="font-weight:normal;" value=""  name="time_' + step_number + '" maxlength="4" min="0" max="1000"></div><span htmlfor="openpcr_time" generated="true" class="units">sec</span></th></tr></table></div>';
				// append a new step to location
				$('#' + location).append(step);
				// make sure the form elements are editable
				$("input").attr("readonly","");
		//// make the window bigger
				// make all the delete buttons shown
				// and if there are any other parts of a "step" that are hide/show, they need to be included here
					$(".edit").show();
					
		}
		
			function addInitialStep()
		{
		// add the step to the preContainer
		addStep("preSteps");
		}
		
	function addFinalStep()
		{
		// add the step to the postContainer
		addStep("postSteps");
		}
		
		/* deleteStep()
		* Delete the parent step
		*/
		function deleteStep()
		{
			// doesn't do anything right now. The delete step button should reference here
		}
		
		
		// Running page					
		/* StopPCR()
		* This function is called when the STOP button (Running page) is clicked and confirmed
		* Or when the "Return to home screen" button is clicked
		* The state "stop" is written out to OpenPCR's control.pcr file
		* Returns: boolean
		*/
		function stopPCR() {	
			// set a variable to grab the current timestamp
				var currentTime = new Date();
			// command_id will match the current command ID
			
			// name of the output file
				var file = window.path.resolvePath("control.pcr"); 
			// write out all the variables, command id + PCR settings
				var pcrProgram = "{\n\t\"command_id\":" + command_id + ",\n" +
					"\t\"state\": stop\n}";
			// write out the file
				var fileStream = new window.runtime.flash.filesystem.FileStream();
				fileStream.open(file, window.runtime.flash.filesystem.FileMode.WRITE); 
				fileStream.writeUTFBytes(pcrProgram); 
				fileStream.close();
			// go to the Running page
			sp2.showPanel(1);
			return false;
		}

	
// JQUERY UI stuffs

$(function(){
	// About Dialog			
		$('#about_dialog').dialog({
			autoOpen: false,
			width: 300,
			modal: true,
			draggable: false,
			resizable: false,
			buttons:
				{
				"OK": function() {
					$(this).dialog("close"); 
					}
				}
		});
	
	// Save Dialog			
		$('#save_form').dialog({
			autoOpen: false,
			width: 300,
			modal: true,
			draggable: false,
			resizable: false,
			position: 'center',
			buttons:
				{
				"Cancel": function() {
					$(this).dialog("close"); 
					 $("#name").val("");
					},
				"Save": function() { 
					 // grab the name from the form
					 name = $("#name").val();
					 // save the current experiment as the given name
					 Save(name);
					 // update the experiment name in the UI
					 $("#ExperimentName").html(name);
					 // close the dialog window
					 $(this).dialog("close"); 
					}
				}
		});
		
	// Save Confirmation Dialog
	$('#save_confirmation_dialog').dialog({
			autoOpen: false,
			width: 300,
			modal: true,
			draggable: false,
			resizable: false
			
		});
		
	// Delete Dialog			
		$('#delete_dialog').dialog({
			autoOpen: false,
			width: 300,
			modal: true,
			draggable: false,
			resizable: false,
			buttons:
				{
				"No": function() {
					$(this).dialog("close"); 
					},
				"Yes": function() { 
					 // delete the current selected experiment
					 deleteCurrentExperiment();
					 // Since the experiment was deleted, go to the home screen
					// refresh the list of Presets
					listExperiments();
					// Home screen
					sp2.showPanel(0);
					// close this window
					 $(this).dialog("close"); 
					}
				}
		});
	
		// Delete Confirmation Dialog
	$('#delete_confirmation_dialog').dialog({
			autoOpen: false,
			width: 300,
			modal: true,
			draggable: false,
			resizable: false
			
		});
		
	// Stop Dialog			
		$('#stop_dialog').dialog({
			autoOpen: false,
			width: 300,
			modal: true,
			draggable: false,
			resizable: false,
			buttons: {
				"No": function() { 
					$(this).dialog("close"); 
				}, 
				"Yes": function() { 
					$(this).dialog("close"); 
					stopPCR();
				}
			}
		});
		
	// Dialog Link
		$('#stop_link').click(function(){
			$('#stop_dialog').dialog('open');
			return false;
		});
	
	// Starting dialog
	$('#starting').dialog({
		autoOpen: false,
			width: 300,
			modal: true,
			draggable: false,
			resizable: false,
		});
		
	//hover states on the static widgets
		$('#dialog_link, ul#icons li').hover(
			function() { $(this).addClass('ui-state-hover'); }, 
			function() { $(this).removeClass('ui-state-hover'); }
		);
		
});	

// Enter/Return Key clicks "Save" on dialog
	$('#save_form').live('keyup', function(e){
  if (e.keyCode == 13) {
    $(':button:contains("Save")').click();
  }
	});
