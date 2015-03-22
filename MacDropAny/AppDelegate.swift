//
//  AppDelegate.swift
//  MacDropAny
//
//  Created by Sebastian Hallum Clarke on 18/12/14.
//  Copyright (c) 2014 Zibity. All rights reserved.
//

import Cocoa
import Foundation



@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
    
    func applicationDidFinishLaunching(aNotification: NSNotification) {
        
        Log("Launching MacDropAny")
        
        // Log Usage Statistics
        NSUserDefaults.standardUserDefaults().synchronize()
        if let DevMode: AnyObject = NSUserDefaults.standardUserDefaults().objectForKey("DevMode") {} else {
            Log("Sending anonymous usage statistics")
            runAppleScript("do shell script \"curl -L -m 15 http://is.gd/MDA3usage > /dev/null 2>&1 &\"")
        }
        
        // Complete First Run Tasks
        if let FirstRun: AnyObject = NSUserDefaults.standardUserDefaults().objectForKey("FirstRun") {} else {
            Log("Running first run tasks")
            
            // Log Growth Statistics
            runAppleScript("do shell script \"curl -L -m 15 http://is.gd/MDA3growth > /dev/null 2>&1 &\"")
            NSUserDefaults.standardUserDefaults().setObject("No", forKey: "FirstRun")
            NSUserDefaults.standardUserDefaults().synchronize()
            
            // Initiate Donation Reminder
            var error = NSErrorPointer()
            NSFileManager.defaultManager().createDirectoryAtPath("~".stringByExpandingTildeInPath + "/Library/Application Support/MacDropAny", withIntermediateDirectories: true, attributes: nil, error: error)
            var theMiniAppPath = NSBundle.mainBundle().pathForResource("MacDropAny Donation Requester", ofType: "app")
            NSFileManager.defaultManager().copyItemAtPath(theMiniAppPath!, toPath: "~".stringByExpandingTildeInPath + "/Library/Application Support/MacDropAny/MacDropAny Donation Requester.app", error: error)
            let theUserFolderPath = "~".stringByExpandingTildeInPath
            runAppleScript("do shell script \"echo \" & quoted form of \"<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?><!DOCTYPE plist PUBLIC \\\"-//Apple//DTD PLIST 1.0//EN\\\" \\\"http://www.apple.com/DTDs/PropertyList-1.0.dtd\\\"><plist version=\\\"1.0\\\"><dict><key>Label</key><string>com.zibity.MacDropAnyDonationRequester</string><key>Program</key><string>\(theUserFolderPath)/Library/Application Support/MacDropAny/MacDropAny Donation Requester.app/Contents/MacOS/applet</string><key>StartInterval</key><integer>259200</integer></dict></plist>\" & \" > ~/Library/LaunchAgents/com.zibity.MacDropAnyDonationProcessor.plist\"")
            shell("/bin/launchctl", arguments: ["unload","\(theUserFolderPath)/Library/LaunchAgents/com.zibity.MacDropAnyDonationProcessor.plist"])
            shell("/bin/launchctl", arguments: ["load","\(theUserFolderPath)/Library/LaunchAgents/com.zibity.MacDropAnyDonationProcessor.plist"])
            var theMiniAppIconPath = NSBundle.mainBundle().pathForResource("MacDropAny", ofType: "icns")
            NSFileManager.defaultManager().copyItemAtPath(theMiniAppIconPath!, toPath: "~".stringByExpandingTildeInPath + "/Library/Application Support/MacDropAny/MacDropAny Donation Requester.app/Contents/Resources/applet.icns", error: error)
            
            // Create History File
            runAppleScript("do shell script \"echo \" & quoted form of \"<head><title>" + NSLocalizedString("MacDropAny Sync History", comment:"Title of sync history document") + "</title></head><body><span style='font-family: Arial, sans-serif;'><h1>" + NSLocalizedString("MacDropAny Sync History", comment:"Title of sync history document") + "</h1><p>" + NSLocalizedString("The following folders have been synced with the cloud using MacDropAny:", comment:"Information text of sync history document") + "</p>\" & \" > ~/Library/Logs/MacDropAny.html\"")
            
            // Load right-click service
            let theServicesFolderContents = shell("/bin/ls", arguments: ["~".stringByExpandingTildeInPath + "/Library/Services"])
            if theServicesFolderContents.rangeOfString("Sync via MacDropAny") == nil {
                let theServiceWorkflowPath = NSBundle.mainBundle().pathForResource("Sync via MacDropAny", ofType: "workflow")
                var error = NSErrorPointer()
                NSFileManager.defaultManager().copyItemAtPath(theServiceWorkflowPath!, toPath: "~".stringByExpandingTildeInPath + "/Library/Services/Sync via MacDropAny.workflow", error: error)
                NSUpdateDynamicServices()
            }
        }
    }
    
    // Manages Dropping of Folders on the app icon
    func application(sender: NSApplication, openFile theDroppedFilePath: String) {
        Log("Folder dropped on the app icon")
        NSUserDefaults.standardUserDefaults().setObject(theDroppedFilePath, forKey: "DroppedFolderPath")
        NSNotificationCenter.defaultCenter().postNotificationName("folderDroppedOnDockIcon", object:self)
        
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(NSApplication!) -> Bool {
        return true
    }
    
    func applicationWillTerminate(aNotification: NSNotification) {
        
    }
    
    @IBAction func theOpenDonatePage(sender: AnyObject) {
        NSWorkspace.sharedWorkspace().openURL(NSURL(string: "http://donate.zibity.com")!)
        shell("/usr/bin/defaults",arguments: ["write", "com.zibity.donate","runcount","1407"])
    }
    
    @IBAction func theOpenHelpPage(sender: AnyObject) {
        NSWorkspace.sharedWorkspace().openURL(NSURL(string: "http://www.zibity.com/macdropany-help.html")!)
    }
    
    @IBAction func theToggleInvisibles(sender: NSMenuItem) {
        NSUserDefaults.standardUserDefaults().synchronize()
    }
    
    @IBAction func openTheLog(sender: NSMenuItem) {
        shell("/usr/bin/open", arguments: ["~".stringByExpandingTildeInPath + "/Library/Logs/MacDropAny.html"])
    }
    
    @IBAction func openLog(sender: NSMenuItem) {
        shell("/usr/bin/open", arguments: ["~".stringByExpandingTildeInPath + "/Library/Logs/MacDropAny.log"])
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
        let output: String = NSString(data: data, encoding: NSUTF8StringEncoding)!
        
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
        let output: String = NSString(data: data, encoding: NSUTF8StringEncoding)!
        
        return output
    }
    
    // To log messages
    func Log(message:String) {
        println(message)
        NSUserDefaults.standardUserDefaults().synchronize()
        if var LogMessages: AnyObject = NSUserDefaults.standardUserDefaults().objectForKey("LogMessages") {
            if LogMessages as NSObject == 1  {
                if let outputStream = NSOutputStream(toFileAtPath: "~/Library/Logs/MacDropAny.log".stringByExpandingTildeInPath, append: true) {
                    outputStream.open()
                    var theFinalMessage = NSDateFormatter.localizedStringFromDate(NSDate(), dateStyle: .MediumStyle, timeStyle: .ShortStyle) + ": " + message + "\n"
                    outputStream.write(theFinalMessage, maxLength: countElements(theFinalMessage))
                    outputStream.close()
                }
            }
        }
    }
    
}