/*
 * Central registry of translation namespaces. Each namespace lives in its own
 * file under ./ns and is defined with the `ns()` helper for key-parity safety.
 * Add a new page → add a file in ./ns and register it here.
 */
import { layout } from "./ns/layout";
import { common } from "./ns/common";
import { home } from "./ns/home";
import { service } from "./ns/service";
import { wallet } from "./ns/wallet";
import { history } from "./ns/history";
import { account } from "./ns/account";
import { auth } from "./ns/auth";
import { fields } from "./ns/fields";
import { payment } from "./ns/payment";
import { resident } from "./ns/resident";
import { birth } from "./ns/birth";
import { death } from "./ns/death";
import { marriage } from "./ns/marriage";
import { divorce } from "./ns/divorce";
import { familyBook } from "./ns/familyBook";
import { hero } from "./ns/hero";
import { news } from "./ns/news";
import { tutorial } from "./ns/tutorial";
import { chat } from "./ns/chat";
import { yourId } from "./ns/yourId";

export const NAMESPACES = {
  layout,
  common,
  home,
  service,
  wallet,
  history,
  account,
  auth,
  fields,
  payment,
  resident,
  birth,
  death,
  marriage,
  divorce,
  familyBook,
  hero,
  news,
  tutorial,
  chat,
  yourId,
} as const;

export type Namespaces = typeof NAMESPACES;
