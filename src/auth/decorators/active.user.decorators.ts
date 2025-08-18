import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { REQUEST_USER_KEY } from "../auth.constant";


export const ActiveUserDecorator = createParamDecorator(
    (field: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request[REQUEST_USER_KEY]
        return field ? user?.[field] : user;
    }
)