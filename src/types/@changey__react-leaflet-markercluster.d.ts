declare module '@changey/react-leaflet-markercluster' {
  import { ComponentType } from 'react';
  import { MarkerClusterGroupOptions } from 'leaflet';
  import { LayerGroupProps } from 'react-leaflet';

  const MarkerClusterGroup: ComponentType<
    LayerGroupProps & MarkerClusterGroupOptions
  >;

  export default MarkerClusterGroup;
}
