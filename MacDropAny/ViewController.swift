//
//  ViewController.swift
//  MacDropAny
//
//  Created by Sebastian Hallum Clarke on 18/12/14.
//  Copyright (c) 2014 Zibity. All rights reserved.
//

import Cocoa
import Foundation
import ServiceManagement

class ViewController: NSViewController {
    
    // Configure UI Vars
    @IBOutlet weak var theChooseAFolderButton: NSButton!
    @IBOutlet weak var theCloudStorageServicePopUp: NSPopUpButton!
    @IBOutlet weak var theSyncNowButton: NSButton!
    @IBOutlet weak var theLocalChosenFolderPathControl: NSPathControl!
    @IBOutlet weak var theCloudChosenFolderPathControl: NSPathControl!
    @IBOutlet weak var theCustomizeButton: NSButton!
    @IBOutlet weak var window: NSWindow!
    @IBOutlet weak var theErrorBox: NSImageView!
    @IBOutlet weak var theWarningButton: NSButton!
    @IBOutlet weak var theProgressIndicator: NSProgressIndicator!
    
    // Configure Global Variables
    var theLocalFolderName = ""
    var theCloudFolderName = ""
    var theCloudUserSpecifiedFolderName = ""
    var theFolderPath = ""
    var theSelectedSyncService = ""
    var usingCustomCloudPath = false
    var chooseAFolderPanel:NSOpenPanel = NSOpenPanel()
    let userDefaults = NSUserDefaults.standardUserDefaults()
    
    // Initial Configuration
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure Listening for File Dropped on App Icon
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "folderDroppedOnDockIcon:", name: "folderDroppedOnDockIcon", object: nil)
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "theCloudStorageServicePopUpClicked", name: "NSPopUpButtonWillPopUpNotification", object: nil)
        
        // Configure UI Elements' Statuses
        theChooseAFolderButton.enabled = true
        theCloudStorageServicePopUp.enabled = false
        theSyncNowButton.enabled = false
        theCustomizeButton.enabled = false
        theWarningButton.hidden = true
        theChooseAFolderButton.keyEquivalent = "\r"
        
        // Populate theCloudStorageServicePopUp's Menu Items
//        var theApplicationsFolderContents = shell("/usr/bin/mdfind", arguments: ["kMDItemKind=Application"])
//        theApplicationsFolderContents = ""
//        if (theApplicationsFolderContents == "") {
//            println("in here")
////            var theApplicationsFolderContents = shell("/bin/ls", arguments: ["/Applications"])
//            theApplicationsFolderContents = "OneDrive.app MEGAsync.app MediaFire Desktop.app hubiC.app Hightail Desktop App.app Google Drive.app Dropbox.app Copy.app Box Sync.app Adobe Creative Cloud.app"
//        }
//        println(theApplicationsFolderContents)
//        if NSProcessInfo.processInfo().operatingSystemVersion.majorVersion >= 10 {
////            theApplicationsFolderContents += "\niCloud Drive.app"
//        }
        var theApplicationsFolderContents = "OneDrive.app MEGAsync.app MediaFire Desktop.app hubiC.app Hightail Desktop App.app Google Drive.app Dropbox.app Copy.app Box Sync.app Adobe Creative Cloud.app"
        for thisSyncService in ["OneDrive","MEGAsync","MediaFire Desktop","iCloud Drive","hubiC","Hightail Desktop App","Google Drive","Dropbox","Copy","Box Sync", "Adobe Creative Cloud"] {
            if theApplicationsFolderContents.rangeOfString(thisSyncService as String + ".app") != nil {
                theCloudStorageServicePopUp.insertItemWithTitle((thisSyncService as String), atIndex: 1)
                theCloudStorageServicePopUp.itemWithTitle(thisSyncService as String)?.enabled = true
            } else if thisSyncService == "Adobe Creative Cloud" {
                if theApplicationsFolderContents.rangeOfString("Adobe Creative Cloud") != nil {
                    theCloudStorageServicePopUp.insertItemWithTitle((thisSyncService as String), atIndex: 1)
                    theCloudStorageServicePopUp.itemWithTitle(thisSyncService as String)?.enabled = true
                }
            } else {
                theCloudStorageServicePopUp.insertItemWithTitle((thisSyncService as String), atIndex: (theCloudStorageServicePopUp.numberOfItems))
                theCloudStorageServicePopUp.itemWithTitle(thisSyncService as String)?.enabled = false
            }
        }
        theCloudStorageServicePopUp.itemWithTitle("Hightail Desktop App")?.title = "Hightail"
        
        // Retrieve Prefered Sync Service from Defaults
        userDefaults.synchronize()
        if var LastSyncService = NSUserDefaults.standardUserDefaults().stringForKey("LastSyncService") {
            theCloudStorageServicePopUp.selectItemWithTitle(LastSyncService)
            theSelectedSyncService = theCloudStorageServicePopUp.titleOfSelectedItem!
        }
        
        // Preconfigure chooseAFolderPanel
        chooseAFolderPanel.message = NSLocalizedString("Choose a folder to sync with the cloud:", comment: "Message on choose a folder window")
        chooseAFolderPanel.allowsMultipleSelection = false
        chooseAFolderPanel.title = "MacDropAny"
        chooseAFolderPanel.prompt = NSLocalizedString("Choose Folder", comment:"Button on choose a folder window")
        chooseAFolderPanel.canChooseDirectories = true
        chooseAFolderPanel.canChooseFiles = false
        chooseAFolderPanel.directoryURL = NSURL(fileURLWithPath: "~".stringByExpandingTildeInPath)
        
        // Validate Initial Configuration
        validateSyncDetails()
        theWarningButton.hidden = true
        

    }
    
    // Step 1: Choose a folder from button
    @IBAction func chooseAFolder(sender: AnyObject) {
        Log("Choose a folder button clicked; initiating chooseAFolderPanel.")
        
        // Run chooseAFolderPanel's OpenPanel
        chooseAFolderPanel.showsHiddenFiles = false
        NSUserDefaults.standardUserDefaults().synchronize()
        if var ShowHiddenFolders: AnyObject = NSUserDefaults.standardUserDefaults().objectForKey("InvisiblesAreShownTick") {
            if ShowHiddenFolders as! NSObject == 1  {
                self.chooseAFolderPanel.showsHiddenFiles = true
            }
        }
        
        chooseAFolderPanel.beginSheetModalForWindow(NSApplication.sharedApplication().keyWindow!) { (result: Int) -> Void in
            if result == NSFileHandlingPanelOKButton {
                self.chosenLocalFolderProcessor(self.chooseAFolderPanel.URL!)
            }
        }
    }
    
    // Step 1: Choose a folder from drag-and-drop
    func folderDroppedOnDockIcon(sender: AnyObject) {
        println(theChooseAFolderButton.title)
        chosenLocalFolderProcessor(NSURL(fileURLWithPath: (NSUserDefaults.standardUserDefaults().objectForKey("DroppedFolderPath") as! String))!)
    }
    
    // Step 1: Process chosen folder
    func chosenLocalFolderProcessor(theLocalChosenFolderURL: NSURL) {
        
        // Save the chosen local folder's details
        theLocalChosenFolderPathControl.URL = theLocalChosenFolderURL
        theLocalFolderName = NSFileManager.defaultManager().displayNameAtPath(theLocalChosenFolderPathControl.URL!.path!)
        
        // Configure Flow-on UI Elements
        theLocalChosenFolderPathControl.hidden = false
        theChooseAFolderButton.keyEquivalent = ""
        theCloudStorageServicePopUp.enabled = true
        theCustomizeButton.enabled = true
        theCloudStorageServicePopUp.keyEquivalent = "\r"
        
        // Validation
        validateSyncDetails()
        generateCloudFolderIcon()
    }
    
    // Enable All Step 2 Sync Services if Option key down
    func theCloudStorageServicePopUpClicked() {
        let checkModifierKeysPath = NSBundle.mainBundle().pathForResource("checkModifierKeys", ofType: "")
        if checkModifierKeysPath != nil {
            if shell(checkModifierKeysPath!, arguments: ["option"]) == "1\n" {
                for thisMenuItem in theCloudStorageServicePopUp.itemArray {
                    if (thisMenuItem as! NSMenuItem).tag != 1407 {
                        (thisMenuItem as! NSMenuItem).enabled = true
                    }
                }
            }
        }
    }
    
    // Step 2: Choose Cloud Storage Service
    @IBAction func cloudStorageServiceSelected(sender: AnyObject) {
        
        // Save Prefered Sync Service
        NSUserDefaults.standardUserDefaults().setObject(theCloudStorageServicePopUp.titleOfSelectedItem, forKey: "LastSyncService")
        NSUserDefaults.standardUserDefaults().synchronize()
        
        // Configure UI Elements' Statuses
        theCloudStorageServicePopUp.keyEquivalent = ""
        theSyncNowButton.keyEquivalent = "\r"
        usingCustomCloudPath = false
        
        // Validation
        validateSyncDetails()
        generateCloudFolderIcon()
    }
    
    // Sync Now Button Press
    @IBAction func syncNow(sender: AnyObject) {
        
        // Prepare for syncing
        var theSelectedSyncService = theCloudStorageServicePopUp.titleOfSelectedItem
        if theSelectedSyncService == "Adobe Creative Cloud" {theSelectedSyncService = "Creative Cloud Files"}
        
        var SyncError:String?
        
        // Main syncing logic
        if theSelectedSyncService == "Dropbox" || theSelectedSyncService == "Copy" || theSelectedSyncService == "hubiC" {
            
            //Create Symbolic Link
            Log("Creating a direct symlink")
            var CreateSymbolicLinkError: NSError?
            NSFileManager.defaultManager().createSymbolicLinkAtURL(theCloudChosenFolderPathControl.URL!, withDestinationURL: theLocalChosenFolderPathControl.URL!, error: &CreateSymbolicLinkError)
            
            // Check for errors
            if CreateSymbolicLinkError != nil {
                SyncError = CreateSymbolicLinkError!.localizedDescription
            }
            
        } else {
            
            // Prepare for syncing
            theProgressIndicator.startAnimation(self)
            var MoveFolderError: NSError?
            
            // Move local folder to the cloud
            Log("Moving the folder to its cloud location")
            NSFileManager.defaultManager().moveItemAtURL(theLocalChosenFolderPathControl.URL!, toURL: theCloudChosenFolderPathControl.URL!, error: &MoveFolderError)
            if MoveFolderError != nil {
                // If the move fails because of insufficient permissions, try to elevate our permissions
                if MoveFolderError!.code == 513 {
                    Log("Insufficient permissions to move folder. Requesting elevated permissions.")
                    var theMoveFolderAppleScriptSource: String = "do shell script \"mv -f \" & quoted form of \"\(theLocalChosenFolderPathControl.URL!.path!)\" & space & quoted form of \"\(theCloudChosenFolderPathControl.URL!.path!)\" with administrator privileges"
                    var theMoveFolderAppleScript: NSAppleScript = NSAppleScript(source: theMoveFolderAppleScriptSource)!
                    var theMoveFolderAppleScriptErrorDictionary: NSDictionary?
                    theMoveFolderAppleScript.executeAndReturnError(&theMoveFolderAppleScriptErrorDictionary)
                    if theMoveFolderAppleScriptErrorDictionary != nil {
                        if theMoveFolderAppleScriptErrorDictionary!["NSAppleScriptErrorNumber"]! as! NSObject == -128 {
                            SyncError = NSLocalizedString("The folder you are trying to sync is protected. You must enter your password to allow MacDropAny to sync this folder.", comment:"")
                        } else {
                            SyncError = (theMoveFolderAppleScriptErrorDictionary!["NSAppleScriptErrorMessage"]! as! String)
                        }
                    }
                } else {
                    SyncError = MoveFolderError!.localizedDescription
                }
            }
            
            if SyncError == nil {
                // Create Symbolic link from the original location to the new cloud location
                Log("Creating the reverse-symlink")
                var CreateSymbolicLinkError: NSError?
                NSFileManager.defaultManager().createSymbolicLinkAtURL(theLocalChosenFolderPathControl.URL!, withDestinationURL: theCloudChosenFolderPathControl.URL!, error: &CreateSymbolicLinkError)
                if CreateSymbolicLinkError != nil {
                    SyncError = CreateSymbolicLinkError!.localizedDescription
                }
            }
            
            // Stop progress indicator
            theProgressIndicator.stopAnimation(self)
        }
        
        if SyncError != nil {
            if theSelectedSyncService == "Creative Cloud Files" {theSelectedSyncService = "Adobe Creative Cloud"}
            // If sync failed, alert user
            Log("Syncing failed. Error: \(SyncError)")
            let theSyncErrorAlert:NSAlert = NSAlert()
            theSyncErrorAlert.addButtonWithTitle(NSLocalizedString("OK", comment:"Button on Sync Failed window"))
            theSyncErrorAlert.messageText = NSLocalizedString("Sync Failed",comment:"Title of Sync Failed window")
            theSyncErrorAlert.alertStyle = .CriticalAlertStyle
            theSyncErrorAlert.informativeText = String(format: NSLocalizedString("MacDropAny has failed to sync the folder '%@' with %@ because of the following error:\n\n%@",comment:"Message of Sync Failed window. %1$@ is the folder name, %2$@ is the sync service, %3$@ is the error message."), theLocalFolderName, theSelectedSyncService!, SyncError!)
            theSyncErrorAlert.beginSheetModalForWindow(NSApplication.sharedApplication().keyWindow!) { (result: Int) -> Void in
                return
            }
            
        } else {
            
            // If sync successful, add to history file and alert the user
            Log("Sync successful")
            
            // Log sync to history file
            runAppleScript("do shell script \"echo \" & quoted form of (\"<li>\" & (current date) & \": \((theLocalChosenFolderPathControl.URL?.path)!) &harr; \((theCloudChosenFolderPathControl.URL?.path)!)</li>\") & \" >> ~/Library/Logs/MacDropAny.html\"")
            
            // Alert user of sync completion
            let theSyncCompleteAlert:NSAlert = NSAlert()
            theSyncCompleteAlert.addButtonWithTitle(NSLocalizedString("Quit MacDropAny", comment:"Button on Sync Successful window"))
            theSyncCompleteAlert.addButtonWithTitle(NSLocalizedString("Sync Another Folder",comment:"Button on Sync Successful window"))
            theSyncCompleteAlert.messageText = NSLocalizedString("Sync Successful!",comment:"Title of Sync Successful window")
            theSyncCompleteAlert.informativeText = String(format: NSLocalizedString("MacDropAny has successfully synced the folder '%@' with %@.",comment:"Message of Sync Successful window. %1$@ is the folder name, %2$@ is the sync service."), theLocalFolderName, theSelectedSyncService!)
            
            theSyncCompleteAlert.beginSheetModalForWindow(NSApplication.sharedApplication().keyWindow!) { (result: Int) -> Void in
                if result == NSAlertFirstButtonReturn {
                    NSApplication.sharedApplication().terminate(self)
                } else {
                    self.theLocalFolderName = ""
                    self.theCloudFolderName = ""
                    self.theCloudUserSpecifiedFolderName = ""
                    self.theFolderPath = ""
                    self.theSelectedSyncService = ""
                    self.usingCustomCloudPath = false
                    self.theCloudChosenFolderPathControl.URL = nil
                    self.theLocalChosenFolderPathControl.URL = nil
                    self.viewDidLoad()
                }
            }
        }
    }
    
    @IBAction func theCustomize(sender: AnyObject) {
        
        let savePanel = NSSavePanel()
        
        NSUserDefaults.standardUserDefaults().synchronize()
        if var ShowHiddenFolders: AnyObject = NSUserDefaults.standardUserDefaults().objectForKey("InvisiblesAreShownTick") {
            if ShowHiddenFolders as! NSObject == 1  {
                savePanel.showsHiddenFiles = true
            }
        }
        
        if theCloudChosenFolderPathControl.URL != nil {
            savePanel.nameFieldStringValue = theCloudChosenFolderPathControl.URL!.lastPathComponent!
        } else {
            if theLocalChosenFolderPathControl.URL != nil {
                savePanel.nameFieldStringValue = theLocalChosenFolderPathControl.URL!.lastPathComponent!
            } else {
                savePanel.nameFieldStringValue = ""
            }
        }
        
        savePanel.title = "MacDropAny"
        savePanel.message = String(format: NSLocalizedString("Choose where in the %@ folder you want to locate the folder '%@':\nYou can also customise the name of the folder in the cloud.",comment: "Message on Set Folder Name and Location dialog. %1$@ is the folder name, %2$@ is the sync service."), theCloudStorageServicePopUp.titleOfSelectedItem!,theLocalFolderName)
        savePanel.prompt = NSLocalizedString("Choose Folder", comment:"Button on choose a folder window")
        savePanel.nameFieldLabel = NSLocalizedString("Folder Name:", comment:"Prompt for user to choose a custom folder name in the Set Folder Name and Location dialog.")
        savePanel.showsTagField = false
        savePanel.directoryURL = theCloudChosenFolderPathControl.URL?.URLByDeletingLastPathComponent
        
        savePanel.beginSheetModalForWindow(NSApplication.sharedApplication().keyWindow!) { (result: Int) -> Void in
            if result == NSFileHandlingPanelOKButton {
                self.theCloudChosenFolderPathControl.URL = savePanel.URL
                self.generateCloudFolderIcon()
            }
        }
        
        
        usingCustomCloudPath = true
        validateSyncDetails()
    }
    
    // To produce the folder icon of the theCloudChosenFolderPathControl
    func generateCloudFolderIcon() {
        if theCloudChosenFolderPathControl.URL != "" && theCloudChosenFolderPathControl.URL != nil {
            var thePath = theCloudChosenFolderPathControl.URL?.path
            var error = NSErrorPointer()
            if !NSFileManager.defaultManager().fileExistsAtPath(thePath!) {
                NSFileManager.defaultManager().createDirectoryAtURL(theCloudChosenFolderPathControl.URL!, withIntermediateDirectories: false, attributes: nil, error: error)
                theCloudChosenFolderPathControl.URL = theCloudChosenFolderPathControl.URL
                NSFileManager.defaultManager().removeItemAtURL(theCloudChosenFolderPathControl.URL!, error: error)
            }
        }
        
    }
    
    // To validate whether we are able to sync yet
    func validateSyncDetails() {
        theSelectedSyncService = theCloudStorageServicePopUp.titleOfSelectedItem!
        if theSelectedSyncService == "Adobe Creative Cloud" {theSelectedSyncService = "Creative Cloud Files"}
        
        // Clear previous error messages
        theWarningButton.hidden = true
        theSyncNowButton.enabled = false
        NSUserDefaults.standardUserDefaults().setObject("", forKey: "theErrorBox")
        NSUserDefaults.standardUserDefaults().synchronize()
        
        // Validate theCloudFolderName
        if theCloudUserSpecifiedFolderName != "" {
            theCloudFolderName = theCloudUserSpecifiedFolderName
        } else if theLocalFolderName != "" {
            theCloudFolderName = theLocalFolderName
        } else {
            addSyncValidationError(NSLocalizedString("The name of the folder in the cloud could not be identified.", comment:"Error message."))
        }
        
        // Validate theSelectedSyncService
        if theSelectedSyncService == "" || theSelectedSyncService == NSLocalizedString("Choose sync service…", comment:"") {
            addSyncValidationError(NSLocalizedString("No sync service has been selected.", comment:"Error message."))
        }
        
        // Set theCloudChosenFolderPathControl.URL
        if usingCustomCloudPath == false {
            if theSelectedSyncService != "" && theCloudFolderName != "" {
                if theSelectedSyncService == "iCloud Drive" {
                    theFolderPath = "~".stringByExpandingTildeInPath + "/Library/Mobile Documents/" + theCloudFolderName + "/"
                    theCloudChosenFolderPathControl.URL = NSURL(fileURLWithPath: theFolderPath)
                } else {
                    if NSFileManager.defaultManager().fileExistsAtPath("~".stringByExpandingTildeInPath + "/" + theSelectedSyncService) {
                        theFolderPath = "~".stringByExpandingTildeInPath + "/" + theSelectedSyncService + "/" + theCloudFolderName + "/"
                        theCloudChosenFolderPathControl.URL = NSURL(fileURLWithPath: theFolderPath)
                    } else {
                        theCloudChosenFolderPathControl.URL = nil
                    }
                }
            }
            if NSFileManager.defaultManager().fileExistsAtPath(theFolderPath) {
                addSyncValidationError(String(format:NSLocalizedString("A folder with the name '%@' already exists at this location in %@.", comment:"Error message. %1$@ is the folder name, %2$@ is the sync service."), theCloudFolderName,theSelectedSyncService))
            }
            if theCloudChosenFolderPathControl.URL == nil {
                addSyncValidationError(String(format:NSLocalizedString("The location for the '%@' folder in %@ has not been specified.", comment:"Error message. %1$@ is the folder name, %2$@ is the sync service."),theCloudFolderName,theSelectedSyncService))
            }
        }
        
        // If validation is successful, allow syncing
        if NSUserDefaults.standardUserDefaults().stringForKey("theErrorBox") == "" {
            theSyncNowButton.enabled = true
            theSyncNowButton.keyEquivalent = "\r"
            theChooseAFolderButton.keyEquivalent = ""
            theCloudStorageServicePopUp.keyEquivalent = ""
        }
    }
    
    func addSyncValidationError(theError: String) {
        NSUserDefaults.standardUserDefaults().synchronize()
        var theErrorBoxText = NSUserDefaults.standardUserDefaults().stringForKey("theErrorBox")
        NSUserDefaults.standardUserDefaults().setObject(theErrorBoxText! + "• " + theError + "\n", forKey: "theErrorBox")
        NSUserDefaults.standardUserDefaults().synchronize()
        theWarningButton.hidden = false
    }
    
    // To Perform Shell Scripts
    func shell(launchPath: String, arguments: [AnyObject]) -> String
    {
        let task = NSTask()
        task.launchPath = launchPath
        task.arguments = arguments
        
        let pipe = NSPipe()
        task.standardOutput = pipe
        task.launch()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output: String = NSString(data: data, encoding: NSUTF8StringEncoding)! as String
        
        return output
    }
    
    // To Perform AppleScripts
    func runAppleScript(theScript: String) -> String
    {
        let task = NSTask()
        task.launchPath = "/usr/bin/osascript"
        task.arguments = ["-e",theScript]
        
        let pipe = NSPipe()
        task.standardOutput = pipe
        task.launch()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output: String = NSString(data: data, encoding: NSUTF8StringEncoding)! as String
        
        return output
    }
    
    func Log(message:String) {
        println(message)
        NSUserDefaults.standardUserDefaults().synchronize()
        if var LogMessages: AnyObject = NSUserDefaults.standardUserDefaults().objectForKey("LogMessages") {
            if LogMessages as! NSObject == 1  {
                if let outputStream = NSOutputStream(toFileAtPath: "~/Library/Logs/MacDropAny.log".stringByExpandingTildeInPath, append: true) {
                    outputStream.open()
                    var theFinalMessage = NSDateFormatter.localizedStringFromDate(NSDate(), dateStyle: .MediumStyle, timeStyle: .ShortStyle) + ": " + message + "\n"
                    outputStream.write(theFinalMessage, maxLength: count(theFinalMessage))
                    outputStream.close()
                }
            }
        }
    }
    
    func LocalisingExternalText() {
        /// BEGIN DONATION TEXT FOR LOCALISATION ///
        NSLocalizedString("MacDropAny: Would you like to donate?", comment:"Title of Donation request Window")
        NSLocalizedString("Hello! It's Sebastian here, MacDropAny's 17 year old developer.\n\nI hope you're enjoying having your folders synced with the cloud with MacDropAny.\n\nMacDropAny is a free app, but it has taken a long time and a lot of work to build. If you find it useful, please consider making a donation to help cover the costs of developing, distributing and supporting it.\n\nThere is nothing more exciting or encouraging for me than knowing that my apps have been useful and valuable to you. By releasing my apps freely, I hope that my apps will be used by as many people as possible, all around the world. I fully appreciate that not everyone is able to donate, but if you can, please do so to help keep my apps free for everyone.\n\nThank you,\nSebastian Hallum Clarke", comment:"Message of Donation Request Window")
        NSLocalizedString("No, thanks", comment:"Button of Donation Request Window")
        NSLocalizedString("Maybe later", comment:"Button of Donation Request Window")
        NSLocalizedString("Donate Now", comment:"Button of Donation Request Window")
        NSLocalizedString("Sync via MacDropAny", comment:"Text on right-click menu in Finder")
        /// END DONATION TEXT FOR LOCALISATION ///
    }
    
    // Not sure what this does, but it was in the default file
    override var representedObject: AnyObject? {
        didSet {
            // Update the view, if already loaded.
        }
    }
    
    
}

