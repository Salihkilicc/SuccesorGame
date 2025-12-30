#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(EconomyBridge, NSObject)

RCT_EXTERN_METHOD(getFinancialData:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(advanceTime:(NSInteger)months
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(restartGame:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
