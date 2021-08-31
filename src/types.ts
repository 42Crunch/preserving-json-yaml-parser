/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

export interface Visitor {
  onObjectStart: (parent: any, key: string | number, value: any) => void;
  onObjectEnd: () => void;
  onArrayStart: (parent: any, key: string | number, value: any) => void;
  onArrayEnd: () => void;
  onValue: (parent: any, key: string | number, value: any, text: string | undefined) => void;
}
