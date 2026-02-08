@echo off
echo Deploying Firestore rules for pricing system...
echo.

echo Deploying Firestore security rules...
firebase deploy --only firestore:rules

echo.
echo Deployment complete!
echo.
echo The pricing system now supports real-time synchronization across all devices.
echo When you update a price on one device, it will automatically appear on all other devices.
echo.
pause