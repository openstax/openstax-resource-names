import { ConfigProvider } from '@openstax/ts-utils/config';
import { ApiResponse } from '@openstax/ts-utils/routing';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { LambdaServices } from '../entry/lambda/services';
import { LocalServices } from '../entry/local';

export type ApiRouteRequest = APIGatewayProxyEventV2;
export type ApiRouteResponse = ApiResponse<number, any>;

export type BaseEnvironmentConfig = {local: ConfigProvider; deployed: ConfigProvider};
type GetEnvironmentConfig = <C extends BaseEnvironmentConfig>(config: C) => C['local'] | C['deployed'];

export type AppServices = {getEnvironmentConfig: GetEnvironmentConfig} & (LambdaServices | LocalServices);
