import * as program from 'commander';

import { ApiService } from 'jslib/abstractions/api.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';

import { OrganizationUserConfirmRequest } from 'jslib/models/request/organizationUserConfirmRequest';

import { Response } from 'jslib/cli/models/response';

import { Utils } from 'jslib/misc/utils';

export class ConfirmCommand {
    constructor(private apiService: ApiService, private cryptoService: CryptoService) { }

    async run(object: string, id: string, cmd: program.Command): Promise<Response> {
        if (id != null) {
            id = id.toLowerCase();
        }

        switch (object.toLowerCase()) {
            case 'org-member':
                return await this.confirmOrganizationMember(id, cmd);
            default:
                return Response.badRequest('Unknown object.');
        }
    }

    private async confirmOrganizationMember(id: string, cmd: program.Command) {
        console.log("1");
        if (cmd.organizationid == null || cmd.organizationid === '') {
            return Response.badRequest('--organizationid <organizationid> required.');
        }
        console.log("2");
        if (!Utils.isGuid(id)) {
            return Response.error('`' + id + '` is not a GUID.');
        }
        console.log("3");
        if (!Utils.isGuid(cmd.organizationid)) {
            return Response.error('`' + cmd.organizationid + '` is not a GUID.');
        }
        console.log("4");
        try {
            console.log("5");
            const orgKey = await this.cryptoService.getOrgKey(cmd.organizationid);
            console.log("6");
            if (orgKey == null) {
                throw new Error('No encryption key for this organization.');
            }
            console.log("7");
            console.log(cmd.organizationid);
            console.log(id);
            const orgUser = await this.apiService.getOrganizationUser(cmd.organizationid, id);
            if (orgUser == null) {
                throw new Error('Member id does not exist for this organization.');
            }
            console.log("8");
            const publicKeyResponse = await this.apiService.getUserPublicKey(orgUser.userId);
            console.log("9");
            const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);
            console.log("10");
            const key = await this.cryptoService.rsaEncrypt(orgKey.key, publicKey.buffer);
            console.log("11");
            const req = new OrganizationUserConfirmRequest();
            console.log("12");
            req.key = key.encryptedString;
            console.log("13");

            

            await this.apiService.postOrganizationUserConfirm(cmd.organizationid, id, req);
            console.log("14");
            return Response.success();
        } catch (e) {
            return Response.error(e);
        }
    }
}
