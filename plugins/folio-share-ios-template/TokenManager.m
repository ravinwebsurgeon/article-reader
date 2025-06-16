#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TokenManager, NSObject)

RCT_EXTERN_METHOD(saveToken:(NSString *)token)
RCT_EXTERN_METHOD(getToken:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(removeToken)

@end