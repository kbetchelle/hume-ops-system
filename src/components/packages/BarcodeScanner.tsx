import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, XCircle, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BarcodeScannerProps {
  onScanSuccess: (code: string) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScanSuccess, onCancel }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [manualEntry, setManualEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setCameraPermissionDenied(false);
    
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach(track => track.stop()); // Stop the permission check stream
      
      // Initialize the barcode reader
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      
      setIsScanning(true);
      
      // Start scanning
      await codeReader.decodeFromVideoDevice(
        undefined, // undefined = default/first camera
        videoRef.current!,
        (result, error) => {
          if (result) {
            const code = result.getText();
            setScannedCode(code);
            setIsScanning(false);
            codeReader.reset();
          }
          
          // Ignore NotFoundException - it just means no barcode was found in this frame
          if (error && !(error instanceof NotFoundException)) {
            console.error("Scan error:", error);
          }
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
      
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setCameraPermissionDenied(true);
        setError("Camera access denied. Please enable camera permissions and try again.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Failed to access camera. Please try manual entry.");
      }
      
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  const handleConfirmCode = () => {
    if (scannedCode.trim()) {
      onScanSuccess(scannedCode.trim());
    }
  };

  const handleManualSubmit = () => {
    const code = (document.getElementById("manual-code-input") as HTMLInputElement)?.value;
    if (code?.trim()) {
      onScanSuccess(code.trim());
    }
  };

  const handleRescan = () => {
    setScannedCode("");
    setError(null);
    startScanning();
  };

  return (
    <div className="space-y-4">
      {!isScanning && !scannedCode && !manualEntry && (
        <div className="space-y-4">
          <Button onClick={startScanning} className="w-full" size="lg">
            <Camera className="mr-2 h-5 w-5" />
            Scan Barcode
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <Button 
            onClick={() => setManualEntry(true)} 
            variant="outline" 
            className="w-full"
          >
            Enter Tracking Code Manually
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {cameraPermissionDenied && (
        <Alert>
          <AlertDescription className="text-sm">
            <strong>To enable camera access:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Click the camera icon in your browser's address bar</li>
              <li>Select "Allow" for camera permissions</li>
              <li>Refresh the page if needed</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isScanning && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                className="w-full h-64 object-cover"
                autoPlay
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-red-500 w-64 h-32 rounded-lg"></div>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Position the barcode within the frame
            </div>
            
            <div className="flex gap-2">
              <Button onClick={stopScanning} variant="outline" className="flex-1">
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  stopScanning();
                  setManualEntry(true);
                }} 
                variant="secondary" 
                className="flex-1"
              >
                Enter Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {scannedCode && !isScanning && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-center py-4">
              <Check className="h-12 w-12 text-green-500" />
            </div>
            
            <div className="space-y-2">
              <Label>Scanned Code</Label>
              <div className="p-3 bg-muted rounded-lg text-center font-mono text-lg">
                {scannedCode}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleRescan} variant="outline" className="flex-1">
                Scan Again
              </Button>
              <Button onClick={handleConfirmCode} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Confirm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {manualEntry && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code-input">Tracking Code</Label>
              <Input
                id="manual-code-input"
                type="text"
                placeholder="Enter tracking number"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleManualSubmit();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setManualEntry(false);
                  setError(null);
                }} 
                variant="outline" 
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleManualSubmit} className="flex-1">
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isScanning && !scannedCode && !manualEntry && !error && (
        <Button onClick={onCancel} variant="ghost" className="w-full">
          Cancel
        </Button>
      )}
    </div>
  );
}
