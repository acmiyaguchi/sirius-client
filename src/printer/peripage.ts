import * as peripage from './commander/peripage';
import PrintableImage from '../printable-image';
import { PrintableImageHandler } from './printable-image-wrapper';
import { PrinterParameters } from '../configuration';
import { assertType, is } from 'typescript-is';
import {
  TransportAdapter,
  TransportConfiguration,
  makeTransportAdapter,
} from '../transport';

export type PeripageParameters = {
  image: {
    width: number;
  };
  transport: TransportConfiguration;
};

export default class PeripagePrinter implements PrintableImageHandler {
  static type = 'peripage';

  parameters: PeripageParameters;
  transport: TransportAdapter;

  constructor(parameters: PeripageParameters) {
    this.parameters = parameters;

    this.transport = makeTransportAdapter(parameters.transport);
  }

  static areParametersValid(parameters: PrinterParameters): boolean {
    return is<PeripageParameters>(parameters);
  }

  static fromParameters(parameters: PrinterParameters): PrintableImageHandler {
    return new this(assertType<PeripageParameters>(parameters));
  }

  async open(): Promise<void> {
    await this.transport.connect();

    // await new Promise((resolve) => setTimeout(resolve, 2000));

    // console.log('lets ago');
    await this.write(await peripage.handshake());
    // await this.write(await peripage.setPowerOffTime(0));
  }

  async close(): Promise<void> {
    await this.transport.disconnect();
  }

  async print(image: PrintableImage): Promise<boolean> {
    image.resize(this.parameters.image.width);

    try {
      // await this.write(
      //   await peripage.pageSetup(this.parameters.image.width, 200) // TODO: what's the image height? let's use that
      // );

      const bits = await image.asBIN();

      console.log(bits.length, this.parameters.image.width);

      await this.write(await peripage.setThickness(peripage.Thickness.Medium));
      await this.write(await peripage.image(bits, this.parameters.image.width));

      // await this.write(await peripage.drawBox(1, 0, 0, 20, 20));
      // await this.write(
      //   await peripage.image(await image.asBIN(), this.parameters.image.width)
      // );
      // await this.write(await peripage.lineFeed(75));
    } catch (error) {
      console.log('uh oh', error);
      return false;
    }

    return true;
  }

  private async write(buffers: Buffer[]): Promise<void> {
    for (const buffer of buffers) {
      console.log(buffer.length, buffer.toString('hex'));
      await this.transport.write(buffer);
    }
  }
}